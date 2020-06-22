import { ReplayFetcher } from "./replay-fetcher";

async function main() {
	const fetcher = new ReplayFetcher(0x1351);
	console.error("Fetching...");
	const messages = await fetcher.fetch(process.argv[2], parseInt(process.argv[3]), process.argv[4]);
	for (let buffer of messages) {
		const proto = buffer.readUInt8(2);
		const content = buffer.toJSON().data;
		if (proto === 25) {
			console.log(buffer.slice(3).toString("utf16le"));
		} else { 
			console.log(proto, content);
		}

	}
}
main();
