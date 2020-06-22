import net from "net";
import { YGOProMessagesHelper } from "./YGOProMessages";
import { reject } from "underscore";


export class ReplayFetcher {
	helper: YGOProMessagesHelper;
	socket: net.Socket;
	messages: number[];
	version: number;
	constructor(version: number) {
		this.version = version;
		this.helper = new YGOProMessagesHelper();
		this.helper.addHandler("STOC_ERROR_MSG", async (buffer: Buffer, info: any, datas: Buffer[], params: any) => {
			return true;
		}, true, 1);
		this.helper.addHandler("STOC_CHAT", async (buffer: Buffer, info: any, datas: Buffer[], params: any) => {
			return info.player > 3;
		}, true, 1);
	}
	connect(ip: string, port: number): Promise<void> {
		return new Promise(async (resolve, reject) => {
			try {
				this.socket = net.connect(port, ip, resolve);
			} catch (err) {
				reject(err);
			}
		});
	}
	receiveMessages(replayID: string, version: number): Promise<void> {
		this.helper.sendMessage(this.socket, "CTOS_PLAYER_INFO", {
			name: "Replay Fetcher"
		});
		this.helper.sendMessage(this.socket, "CTOS_JOIN_GAME", {
			version,
			pass: replayID
		});
		return new Promise(async (resolve, reject) => {
			this.socket.on("data", async (buffer) => {
				this.messages = this.messages.concat(buffer.toJSON().data);
			});
			this.socket.on("close", resolve);
			this.socket.on("error", reject);
		});
	}
	async fetch(ip: string, port: number, replayID: string): Promise<Buffer[]> {
		this.messages = [];
		await this.connect(ip, port);
		await this.receiveMessages(replayID, this.version);
		const { datas, feedback } = await this.helper.handleBuffer(Buffer.from(this.messages), "STOC", null, null);
		if (feedback) {
			console.error(feedback.message);
		}
		return datas;
	}
}
