import OpenAI from "openai";

class ChatGPTAPI {
    constructor(api_key) {
        openai.api_key = api_key;
    }

    generate_response(prompt, model="gpt-3.5-turbo", max_tokens=50, temperature=1.0) {
        const response = openai.Completion.create({
            model: model,
            prompt: prompt,
            max_tokens: max_tokens,
            temperature: temperature,
        });
        return response.choices[0].text.strip();
    }
}

function execute(chatGPT3APIkey, behavior, ChatMessage) {
    const api = new ChatGPTAPI(chatGPT3APIkey);
    const response = api.generate_response(behavior + ChatMessage);
    return response;
}

export class OpenAIOperations {
    constructor(BOT_PROMPT, openai_key, model_name, history_length, RANDOM_INT) {
        this.messages = [{role: "system", content: BOT_PROMPT}];
        this.api_key = openai_key;
        this.model_name = model_name;
        this.history_length = history_length;
        this.RANDOM_INT = RANDOM_INT;
        this.lastCalled = Date.now();
        this.cooldownPeriod = 10000; // 10 seconds
    }

    check_history_length() {
        console.log(`Conversations in History: ${((this.messages.length / 2) -1)}/${this.history_length}`);
        if (this.messages.length > ((this.history_length * 2) + 1)) {
            console.log('Message amount in history exceeded. Removing oldest user and assistant messages.');
            this.messages.splice(1, 2);
        }
    }

    randomInteraction() {
        const randomChance = Math.floor(Math.random() * 100);
        if (randomChance < this.RANDOM_INT) {
            const message = "Let's discuss something interesting based on our theme: " + this.messages[0].content;  // Use BOT_PROMPT to influence the interaction
            return this.make_openai_call(message);
        } else {
            console.log("No random interaction.");
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
            // Use BOT_PROMPT to influence the conversation style and tone, not as part of the direct input
            const behavior = this.messages[0].content; // Use BOT_PROMPT as behavior
            const response = execute(this.api_key, behavior, text);
            this.messages.push({role: "user", content: text});
            this.check_history_length();
            this.messages.push({role: "assistant", content: response});
            console.log(`Agent Response: ${response}`);
            return response;
        } catch (error) {
            console.error("Error in make_openai_call:", error);
            return "Sorry, something went wrong. Please try again later.";
        }
    }

    getRecentMessages() {
        // This function returns the last few messages to give context to the AI
        return this.messages.slice(-5).map(msg => `${msg.role}: ${msg.content}`).join('\n');
    }
}
