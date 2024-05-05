import OpenAI from "openai";

export class OpenAIOperations {
    constructor(BOT_PROMPT, openai_key, model_name, history_length, RANDOM_INT) {
        this.messages = [{role: "system", content: BOT_PROMPT}];
        this.api_key = openai_key;
        this.model_name = model_name;
        this.history_length = history_length;
        this.RANDOM_INT = RANDOM_INT;
        this.lastCalled = Date.now();
        this.cooldownPeriod = 10000; // 10 seconds
        this.openai = new OpenAI({ apiKey: openai_key });
    }

    check_history_length() {
        console.log(`Conversations in History: ${((this.messages.length / 2) - 1)}/${this.history_length}`);
        if (this.messages.length > ((this.history_length * 2) + 1)) {
            console.log('Message amount in history exceeded. Removing oldest user and assistant messages.');
            this.messages.splice(1, 2);
        }
    }

    async randomInteraction(text, user) {
        const randomChance = Math.floor(Math.random() * 100);
        if (randomChance < this.RANDOM_INT && user.username !== TWITCH_USER) {
            const prompt = `${this.messages[0].content}\nUser: ${text}\nAssistant:`;
            return await this.make_openai_call(prompt);
        } else {
            console.log("No random interaction or bot is trying to reply to itself.");
            return null;
        }
    }

    async make_openai_call(text) {
        const currentTime = Date.now();
        if (currentTime - this.lastCalled < this.cooldownPeriod) {
            console.log("Cooldown in effect. Try again later.");
            return null;  // Prevent output during cooldown
        }
        this.lastCalled = currentTime;

        try {
            const conversationContext = `${this.messages[0].content}\nRecent Conversation:\n${this.getRecentMessages()}`;
            this.messages.push({role: "user", content: text});
            this.check_history_length();

            const response = await this.openai.chat.completions.create({
                model: this.model_name,
                messages: this.messages,
                temperature: 0.9,
                max_tokens: 150,
                top_p: 1,
                frequency_penalty: 0,
                presence_penalty: 0.6,
                stop: ["\n", " User:", " Assistant:"]
            });

            if (response.choices && response.choices.length > 0) {
                let agent_response = response.choices[0].message.content;
                this.messages.push({role: "assistant", content: agent_response});
                console.log(`Agent Response: ${agent_response}`);
                return agent_response;
            } else {
                throw new Error("No choices returned from OpenAI");
            }
        } catch (error) {
            console.error("Error in make_openai_call:", error);
            return "Sorry, something went wrong. Please try again later.";
        }
    }

    getRecentMessages() {
        // This function returns the last few messages to give context to the AI
        return this.messages.slice(-7).map(msg => `${msg.role}: ${msg.content}`).join('\n');
    }
}
