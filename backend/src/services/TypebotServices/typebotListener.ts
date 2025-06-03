import axios from "axios";
import Ticket from "../../models/Ticket";
import QueueIntegrations from "../../models/QueueIntegrations";
import { WASocket, delay, proto } from "@whiskeysockets/baileys";
import { getBodyMessage } from "../WbotServices/wbotMessageListener";
import { logger } from "../../utils/logger";
import { isNil } from "lodash";
import UpdateTicketService from "../TicketServices/UpdateTicketService";

type Session = WASocket & { id?: number };

interface Request {
  wbot: Session;
  msg: proto.IWebMessageInfo;
  ticket: Ticket;
  typebot: QueueIntegrations;
}

const typebotListener = async ({ wbot, msg, ticket, typebot }: Request): Promise<void> => {
  if (msg.key.remoteJid === "status@broadcast") return;

  const {
    urlN8N: url,
    typebotExpires,
    typebotKeywordFinish,
    typebotKeywordRestart,
    typebotUnknownMessage,
    typebotSlug,
    typebotDelayMessage,
    typebotRestartMessage
  } = typebot;

  const number = msg.key.remoteJid.replace(/\D/g, "");
  const body = getBodyMessage(msg);

  async function createSession() {
    try {
      const data = {
        isStreamEnabled: true,
        message: "start",
        resultId: "start",
        isOnlyRegistering: false,
        prefilledVariables: {
          number,
          pushName: msg.pushName || ""
        }
      };

      const response = await axios.post(`${url}/api/v1/typebots/${typebotSlug}/startChat`, data, {
        headers: { "Content-Type": "application/json" }
      });

      return response.data;
    } catch (err) {
      logger.error("Erro ao criar sessão do Typebot:", err);
      throw err;
    }
  }

  async function continueSession(sessionId: string, message: string) {
    try {
      const data = { message };
      const response = await axios.post(`${url}/api/v1/sessions/${sessionId}/continueChat`, data, {
        headers: { "Content-Type": "application/json" }
      });
      return response.data;
    } catch (err) {
      logger.error("Erro ao continuar sessão do Typebot:", err);
      throw err;
    }
  }

  try {
    const expiredAt = new Date();
    expiredAt.setMinutes(expiredAt.getMinutes() - Number(typebotExpires));

    if (typebotExpires > 0 && ticket.updatedAt < expiredAt) {
      await ticket.update({ typebotSessionId: null, isBot: true });
      await ticket.reload();
    }

    let sessionId = ticket.typebotSessionId;
    let responseData;

    if (isNil(sessionId)) {
  const startResponse = await createSession();
  sessionId = startResponse.sessionId;

  await ticket.update({
    typebotSessionId: sessionId,
    typebotStatus: true,
    useIntegration: true,
    integrationId: typebot.id
  });

  // ⚠️ Agora sim, continue o fluxo com a mensagem do usuário
  responseData = await continueSession(sessionId, body);
  } else {
  responseData = await continueSession(sessionId, body);
  }

    const messages = responseData.messages || [];
    const input = responseData.input;

    for (const message of messages) {
      if (message.type === "text") {
        let formatted = message.content.richText.map(r => r.children.map(c => c.text).join("")).join("\n");
        if (formatted.startsWith("#")) {
          try {
            const trigger = JSON.parse(formatted.replace("#", ""));
            if (trigger.stopBot) {
              await ticket.update({ useIntegration: false, isBot: false });
              return;
            }
            await UpdateTicketService({
              ticketData: {
                queueId: trigger.queueId,
                userId: trigger.userId,
                chatbot: false,
                useIntegration: false,
                integrationId: null
              },
              ticketId: ticket.id,
              companyId: ticket.companyId
            });
            return;
          } catch (err) {
            logger.warn("Gatilho JSON inválido:", err);
          }
        }
        await wbot.sendPresenceUpdate("composing", msg.key.remoteJid);
        await delay(typebotDelayMessage);
        await wbot.sendPresenceUpdate("paused", msg.key.remoteJid);
        await wbot.sendMessage(msg.key.remoteJid, { text: formatted });
      }

      if (message.type === "image") {
        await wbot.sendMessage(msg.key.remoteJid, { image: { url: message.content.url } });
      }

      if (message.type === "audio") {
        await wbot.sendMessage(msg.key.remoteJid, {
          audio: { url: message.content.url },
          mimetype: "audio/mp4",
          ptt: true
        });
      }
    }

    if (input?.type === "choice input") {
      const formatted = input.items.map(i => `▶️ ${i.content}`).join("\n");
      await wbot.sendMessage(msg.key.remoteJid, { text: formatted });
    }

    if (body === typebotKeywordRestart) {
      await ticket.update({ isBot: true, typebotSessionId: null });
      await ticket.reload();
      await wbot.sendMessage(`${number}@c.us`, { text: typebotRestartMessage });
    }

    if (body === typebotKeywordFinish) {
      await UpdateTicketService({
        ticketData: {
          status: "closed",
          useIntegration: false,
          integrationId: null
        },
        ticketId: ticket.id,
        companyId: ticket.companyId
      });
    }
  } catch (error) {
    logger.error("Erro geral no typebotListener:", error);
    await ticket.update({ typebotSessionId: null });
  }
};

export default typebotListener;
