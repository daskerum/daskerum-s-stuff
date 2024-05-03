import OpenAI from "openai";

export class OpenAIOperations {
    constructor(BOT_PROMPT, openai_key, model_name, history_length) {
        this.messages = [{role: "system", content: BOT_PROMPT}];
        this.openai = new OpenAI({
            apiKey: openai_key,
        });
        this.model_name = model_name;
        this.history_length = history_length;
    }

    check_history_length() {
        console.log(`Conversations in History: ${((this.messages.length / 2) -1)}/${this.history_length}`);
        if(this.messages.length > ((this.history_length * 2) + 1)) {
            console.log('Message amount in history exceeded. Removing oldest user and agent messages.');
            this.messages.splice(1,2);
        }
    }

    // Rastgele etkileşim fonksiyonu
    randomInteraction(randomInt) {
        const randomChance = Math.floor(Math.random() * 100); // 0-99 arası rastgele sayı
        if (randomChance < randomInt) {
            console.log("Rastgele etkileşim yapıldı!");
            // Etkileşim yapılacak işlemleri burada gerçekleştirin
        } else {
            console.log("Rastgele etkileşim yapılmadı.");
        }
    }

    async make_openai_call(text) {
        try {
            this.messages.push({role: "user", content: text});
            this.check_history_length();

            const response = await this.openai.chat.completions.create({
                model: this.model_name,
                messages: this.messages,
                temperature: 1,
                max_tokens: 256,
                top_p: 1,
                frequency_penalty: 0,
                presence_penalty: 0,
            });

            if (response.choices) {
                let agent_response = response.choices[0].message.content;
                console.log(`Agent Response: ${agent_response}`);
                this.messages.push({role: "assistant", content: agent_response});
                return agent_response;
            } else {
                throw new Error("No choices returned from openai");
            }
        } catch (error) {
            console.error(error);
            return "Sorry, something went wrong. Please try again later.";
        }
    }

    async make_openai_call_completion(text) {
        try {
            const response = await this.openai.completions.create({
              model: "text-davinci-003",
              prompt: text,
              temperature: 1,
              max_tokens: 256,
              top_p: 1,
              frequency_penalty: 0,
              presence_penalty: 0,
            });

            if (response.choices) {
                let agent_response = response.choices[0].text;
                console.log(`Agent Response: ${agent_response}`);
                return agent_response;
            } else {
                throw new Error("No choices returned from openai");
            }
        } catch (error) {
            console.error(error);
            return "Sorry, something went wrong. Please try again later.";
        }
    }
}
