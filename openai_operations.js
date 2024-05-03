// Import modules
import OpenAI from "openai";

export class OpenAIOperations {
    constructor(openai_key, model_name, history_length, file_context) {
        this.openai = new OpenAI({
            apiKey: openai_key,
        });
        this.model_name = model_name;
        this.history_length = history_length;
        this.file_context = file_context;
        this.basePrompt = "";  // Boş bir dizeyle başlatın
        this.messages = []; // Mesajları depolamak için boş bir dizi oluşturun
        this.loadPrompt();  // Başlangıçta önbelleği asenkron olarak yükleyin
    }

    async loadPrompt() {
        try {
            this.basePrompt = await fs.readFile("./file_context.txt", 'utf8');
            console.log("Prompt başarıyla yüklendi");
        } catch (error) {
            console.error("Dosya yüklenemedi:", error);
            this.basePrompt = "Dosya yüklenemediği için varsayılan bir ileti.";
        }
    }


    check_history_length() {
        // Use template literals to concatenate strings
        console.log(`Conversations in History: ${((this.messages.length / 2) -1)}/${this.history_length}`);
        if(this.messages.length > ((this.history_length * 2) + 1)) {
            console.log('Message amount in history exceeded. Removing oldest user and agent messages.');
            this.messages.splice(1,2);
        }
    }

    async make_openai_call(text) {
        try {
            //Add user message to  messages
            this.messages.push({role: "user", content: text});

            //Check if message history is exceeded
            this.check_history_length();

            // Use await to get the response from openai
            const response = await this.openai.chat.completions.create({
                model: this.model_name,
                messages: this.messages,
                temperature: 1,
                max_tokens: 256,
                top_p: 1,
                frequency_penalty: 0,
                presence_penalty: 0,
            });

            // Check if response has choices
            if (response.choices) {
                let agent_response = response.choices[0].message.content;
                console.log(`Agent Response: ${agent_response}`);
                this.messages.push({role: "assistant", content: agent_response});
                return agent_response;
            } else {
                // Handle the case when no choices are returned
                throw new Error("No choices returned from openai");
            }
        } catch (error) {
            // Handle any errors that may occur
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

            // Check if response has choices
            if (response.choices) {
                let agent_response = response.choices[0].text;
                console.log(`Agent Response: ${agent_response}`);
                return agent_response;
            } else {
                // Handle the case when no choices are returned
                throw new Error("No choices returned from openai");
            }
        } catch (error) {
            // Handle any errors that may occur
            console.error(error);
            return "Sorry, something went wrong. Please try again later.";
        }
    }
}
