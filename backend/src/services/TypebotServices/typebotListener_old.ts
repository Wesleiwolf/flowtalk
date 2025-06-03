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
  let body = getBodyMessage(msg);

  async function createSession() {
    try {
      const reqData = JSON.stringify({
        isStreamEnabled: true,
        message: "string",
        resultId: "string",
        isOnlyRegistering: false,
        prefilledVariables: {
          number,
          pushName: msg.pushName || ""
        }
      });

      const config = {
        method: "post",
        url: `${url}/api/v1/typebots/${typebotSlug}/startChat`,
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json"
        },
        data: reqData
      };

      const response = await axios.request(config);
      return response.data;
    } catch (err) {
      logger.error("❌ Erro ao criar sessão do Typebot:", err);
      throw err;
    }
  }

  try {
    const dataLimite = new Date();
    dataLimite.setMinutes(dataLimite.getMinutes() - Number(typebotExpires));

    if (typebotExpires > 0 && ticket.updatedAt < dataLimite) {
      await ticket.update({ typebotSessionId: null, isBot: true });
      await ticket.reload();
    }

    let sessionId = ticket.typebotSessionId;
    let isSessionActive = ticket.typebotStatus;
    let isNewSession = false;

    if (isNil(sessionId)) {
      const dataStart = await createSession();
      sessionId = dataStart.sessionId;
      isSessionActive = true;
      isNewSession = true;

      await ticket.update({
        typebotSessionId: sessionId,
        typebotStatus: true,
        useIntegration: true,
        integrationId: typebot.id
      });
    }

    if (!isSessionActive) return;

    // Chamando continueChat sempre
    const reqData = JSON.stringify({ message: body });
    const config = {
      method: "post",
      url: `${url}/api/v1/sessions/${sessionId}/continueChat`,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json"
      },
      data: reqData
    };

    const response = await axios.request(config);
    const messages = response.data?.messages || [];
    const input = response.data?.input;

    logger.info(`💬 Resposta do Typebot para ${number}:`, messages);

    if (messages.length === 0) {
      await wbot.sendMessage(`${number}@c.us`, { text: typebotUnknownMessage });
    } else {
      for (const message of messages) {
        logger.info(`📤 Enviando mensagem do Typebot: ${JSON.stringify(message)}`);

        if (message.type === "text") {
          let formattedText = "";
          let linkPreview = false;

          for (const richText of message.content.richText) {
            for (const element of richText.children) {
              let text = element.text || "";

              if (element.bold) text = `*${text}*`;
              if (element.italic) text = `_${text}_`;
              if (element.underline) text = `~${text}~`;

              if (element.url) {
                const linkText = element.children?.[0]?.text || text;
                text = `[${linkText}](${element.url})`;
                linkPreview = true;
              }

              formattedText += text;
            }
            formattedText += "\n";
          }

          formattedText = formattedText.trim();

          if (formattedText === "Invalid message. Please, try again.") {
            formattedText = typebotUnknownMessage;
          }

          // Verifica se é JSON gatilho
          if (formattedText.startsWith("#")) {
            try {
              const jsonGatilho = JSON.parse(formattedText.replace("#", ""));

              if (jsonGatilho.stopBot && isNil(jsonGatilho.userId) && isNil(jsonGatilho.queueId)) {
                await ticket.update({ useIntegration: false, isBot: false });
                return;
              }

              if (jsonGatilho.queueId && isNil(jsonGatilho.userId)) {
                await UpdateTicketService({
                  ticketData: {
                    queueId: jsonGatilho.queueId,
                    chatbot: false,
                    useIntegration: false,
                    integrationId: null
                  },
                  ticketId: ticket.id,
                  companyId: ticket.companyId
                });
                return;
              }

              if (jsonGatilho.queueId && jsonGatilho.userId) {
                await UpdateTicketService({
                  ticketData: {
                    queueId: jsonGatilho.queueId,
                    userId: jsonGatilho.userId,
                    chatbot: false,
                    useIntegration: false,
                    integrationId: null
                  },
                  ticketId: ticket.id,
                  companyId: ticket.companyId
                });
                return;
              }
            } catch (err) {
              logger.warn("⚠️ Gatilho JSON inválido:", err);
            }
          }

          await wbot.presenceSubscribe(msg.key.remoteJid);
          await wbot.sendPresenceUpdate("composing", msg.key.remoteJid);
          await delay(typebotDelayMessage);
          await wbot.sendPresenceUpdate("paused", msg.key.remoteJid);
          await wbot.sendMessage(msg.key.remoteJid, { text: formattedText });
        }

        if (message.type === "audio") {
          await wbot.presenceSubscribe(msg.key.remoteJid);
          await wbot.sendPresenceUpdate("composing", msg.key.remoteJid);
          await delay(typebotDelayMessage);
          await wbot.sendPresenceUpdate("paused", msg.key.remoteJid);
          await wbot.sendMessage(msg.key.remoteJid, {
            audio: {
              url: message.content.url,
              mimetype: "audio/mp4",
              ptt: true
            }
          });
        }

        if (message.type === "image") {
          await wbot.presenceSubscribe(msg.key.remoteJid);
          await wbot.sendPresenceUpdate("composing", msg.key.remoteJid);
          await delay(typebotDelayMessage);
          await wbot.sendPresenceUpdate("paused", msg.key.remoteJid);
          await wbot.sendMessage(msg.key.remoteJid, {
            image: { url: message.content.url }
          });
        }
      }

      if (input?.type === "choice input") {
        let formattedText = "";
        for (const item of input.items) {
          formattedText += `▶️ ${item.content}\n`;
        }

        formattedText = formattedText.trim();
        await wbot.presenceSubscribe(msg.key.remoteJid);
        await wbot.sendPresenceUpdate("composing", msg.key.remoteJid);
        await delay(typebotDelayMessage);
        await wbot.sendPresenceUpdate("paused", msg.key.remoteJid);
        await wbot.sendMessage(msg.key.remoteJid, { text: formattedText });
      }
    }

    if (body === typebotKeywordRestart) {
      await ticket.update({
        isBot: true,
        typebotSessionId: null
      });

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
      return;
    }
  } catch (error) {
    logger.error("❌ Erro no typebotListener:", error);
    await ticket.update({ typebotSessionId: null });
  }
};

export default typebotListener;
