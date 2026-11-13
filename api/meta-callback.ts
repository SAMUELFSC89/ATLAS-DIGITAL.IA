export default function callbackHandler(_req: unknown, res: any) {
  res.setHeader("Cache-Control", "no-store");
  return res.status(410).send("Volte ao portal da Atlas e inicie a conexão atual do WhatsApp.");
}
