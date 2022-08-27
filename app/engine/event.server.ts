type Event = { type: string; payload: object };

export async function publishEvent(event: Event) {
  console.log(`publishing evens ${event}`);
}
