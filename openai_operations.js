// openai_operations.js
import OpenAI from "openai";

export class OpenAIOperations {
    constructor(BOT_PROMPT, openai_key, model_name, history_length, RANDOM_INT) {
        this.messages = [{role: "system", content: BOT_PROMPT}];
        this.openai = new OpenAI({ apiKey: openai_key });
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

// Modify the randomInteraction method
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

   // Modify the make_openai_call method
async make_openai_call(text) {
    const currentTime = Date.now();
    if (currentTime - this.lastCalled < this.cooldownPeriod) {
        console.log("Cooldown in effect. Try again later.");
        return null;  // Ensure no message is sent during cooldown
    }
    this.lastCalled = currentTime;  // Update last called time

    try {
        // Ensure the BOT_PROMPT is effectively combined with the user input
        const fullPrompt = `${this.messages[0].content}\n${text}`;
        this.messages.push({role: "user", content: text});
        this.check_history_length();

        const response = await this.openai.chat.completions.create({
            model: this.model_name,
            messages: this.messages,
            temperature: 0.7,
            max_tokens: 100,
            top_p: 1,
            frequency_penalty: 0.5,
            presence_penalty: 0.6
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
        return this.messages.slice(-5).map(msg => `${msg.role}: ${msg.content}`).join('\n');
    }

    async make_openai_call_completion(text) {
        try {
            const formattedText = `${this.messages[0].content}\nUser: ${text}\nAssistant:`;
            this.messages.push({role: "user", content: formattedText});
            this.check_history_length();

            const response = await this.openai.completions.create({
                model: "text-davinci-003",
                prompt: formattedText,
                temperature: 1,
                max_tokens: 256,
                top_p: 1,
                frequency_penalty: 0,
                presence_penalty: 0,
            });

            if (response.choices) {
                let agent_response = response.choices[0].text;
                console.log(`Agent Response: ${agent_response}`);
                this.messages.push({role: "assistant", content: agent_response});
                return agent_response;
            } else {
                throw new Error("No choices returned from OpenAI");
            }
        } catch (error) {
            console.error(error);
            return "Sorry, something went wrong. Please try again later.";
        }
    }
}
