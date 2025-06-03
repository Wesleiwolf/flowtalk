import { Request, Response } from "express";

export const typebotWebhook = async (req: Request, res: Response): Promise<Response> => {
  try {
    const payload = req.body;
    console.log("🔁 Recebido do Typebot:", payload);

    // Aqui você pode validar ou salvar os dados

    return res.status(200).json({ success: true, message: "Recebido com sucesso!" });
  } catch (error) {
    console.error("Erro no webhook do Typebot:", error);
    return res.status(500).json({ error: "Erro interno no servidor" });
  }
};
