import OpenAI from "openai";
import fs from 'fs/promises';

export class OpenAIOperations {
    const filePath = `${__dirname}/file_context.txt`;
    constructor(openai_key, model_name, history_length, filePath) {
        this.openai = new OpenAI({
            apiKey: openai_key,
        });
        this.model_name = model_name;
        this.history_length = history_length;
        this.filePath = filePath;
        this.basePrompt = "";  // Initialize with an empty string
        this.loadPrompt();  // Asynchronously load the prompt at startup
    }

    async loadPrompt() {
        try {
            this.basePrompt = await fs.readFile(this.filePath, 'utf8');
            console.log("Prompt loaded successfully from", this.filePath);
        } catch (error) {
            console.error("Failed to load the file:", error);
            this.basePrompt = "Default prompt due to file load failure.";
        }
    }

    check_history_length() {
        console.log(`Conversations in History: ${((this.messages.length / 2) -1)}/${this.history_length}`);
        if (this.messages.length > ((this.history_length * 2) + 1)) {
            console.log('Message amount in history exceeded. Removing oldest user and agent messages.');
            this.messages.splice(1, 2);
        }
    }

    async make_openai_call(text) {
        await this.loadPrompt(); // Reload the prompt to ensure it's up-to-date
        const fullPrompt = `${this.basePrompt}\n${text}`;
        this.messages.push({role: "user", content: fullPrompt});
        this.check_history_length();

        try {
            const response = await this.openai.chat.completions.create({
                model: this.model_name,
                messages: this.messages,
                temperature: 1,
                max_tokens: 256,
                top_p: 1,
                frequency_penalty: 0,
                presence_penalty: 0,
            });

            if (response.choices && response.choices.length > 0) {
                let agent_response = response.choices[0].message.content;
                this.messages.push({role: "assistant", content: agent_response});
                return agent_response;
            } else {
                throw new Error("No choices returned from OpenAI");
            }
        } catch (error) {
            console.error('Error in make_openai_call:', error);
            return "Sorry, something went wrong. Please try again later.";
        }
    }
}
