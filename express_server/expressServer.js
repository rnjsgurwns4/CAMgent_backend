"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// expressServer.ts
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const Agent_1 = require("../agent/Agent");
const app = (0, express_1.default)();
const port = 3000;
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// POST /camera-setting
app.post("/agent-conversation", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { message } = req.body;
        const result = yield Agent_1.agent.conversate(message);
        // type === 'execute' 메시지 찾기
        const executeMsg = result.find((msg) => msg.type === "execute");
        // 타입 좁히기
        if (executeMsg && executeMsg.type === "execute" && "value" in executeMsg) {
            res.json(executeMsg.value);
        }
        else {
            res.status(404).json({ error: "execute message not found" });
        }
    }
    catch (e) {
        console.error(e);
        res.status(500).json({ error: "agent error" });
    }
}));
app.listen(port, () => {
    console.log(`Express server listening on http://localhost:${port}`);
});
