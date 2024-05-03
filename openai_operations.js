import OpenAI from "openai";

export class OpenAIOperations {
    constructor(file_context, openai_key, model_name, history_length) {
        this.messages = [{role: "system", content: file_context}];
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

   async make_openai_call(text) {
    // Persona bilgilerini çevre değişkenlerinden alın
    const personaDescription = process.env.PERSONA_DESCRIPTION || "Default description";
    const personaStyle = process.env.PERSONA_STYLE || "Default style";
    const personaInstructions = process.env.PERSONA_INSTRUCTIONS || "Default instructions";

    // Yeni mesajı kullanıcının mesajı olarak ekle
    this.messages.push({role: "user", content: text});

//Check if message history is exceeded
            this.check_history_length();


    // Chat completions için gerekli parametreleri ayarla
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
                console.log(`Agent Response: ${agent_response}`);
                this.messages.push({role: "assistant", content: agent_response});
                return agent_response;
            } else {
                throw new Error("No valid choices returned from OpenAI");
            }
        } catch (error) {
            console.error('Error in make_openai_call:', error);
            return "Sorry, something went wrong. Please try again later.";
        }
    }
}
