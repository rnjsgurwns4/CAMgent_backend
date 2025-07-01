// expressServer.ts
import express from 'express';
import cors from 'cors';
import { agent } from '../agent/Agent';

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

// POST /camera-setting
app.post("/agent-conversation", async (req, res) => {
    try {
      const { message } = req.body;
      const result = await agent.conversate(message);
      // type === 'execute' 메시지 찾기
      const executeMsg = result.find((msg: any) => msg.type === "execute");

      // 타입 좁히기
      if (executeMsg && executeMsg.type === "execute" && "value" in executeMsg) {
        res.json(executeMsg.value);
      } else {
        res.status(404).json({ error: "execute message not found" });
      }
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "agent error" });
    }
  });

app.listen(port, () => {
  console.log(`Express server listening on http://localhost:${port}`);
});
