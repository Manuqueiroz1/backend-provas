const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const OPENAI_API_KEY = process.env.OPENAI_API_KEY; 

app.post('/api/gerar-prova', async (req, res) => {
    try {
        const { prompt } = req.body;

        // 1. Cria a thread
        const threadResp = await axios.post(
            'https://api.openai.com/v1/threads',
            {},
            {
                headers: {
                    'Authorization': `Bearer ${OPENAI_API_KEY}`,
                    'Content-Type': 'application/json',
                    'OpenAI-Beta': 'assistants=v2'
                }
            }
        );
        const thread = threadResp.data;

        // 2. Envia o prompt
        await axios.post(
            `https://api.openai.com/v1/threads/${thread.id}/messages`,
            { role: 'user', content: prompt },
            {
                headers: {
                    'Authorization': `Bearer ${OPENAI_API_KEY}`,
                    'Content-Type': 'application/json',
                    'OpenAI-Beta': 'assistants=v2'
                }
            }
        );

        // 3. Executa o assistant
        const runResp = await axios.post(
            `https://api.openai.com/v1/threads/${thread.id}/runs`,
            { assistant_id: 'asst_Bj27krTtbaCLJSgNpzYiMb18' }, // Coloque seu Assistant ID aqui
            {
                headers: {
                    'Authorization': `Bearer ${OPENAI_API_KEY}`,
                    'Content-Type': 'application/json',
                    'OpenAI-Beta': 'assistants=v2'
                }
            }
        );
        const run = runResp.data;

        // 4. Espera a conclusão
        let status = run.status;
        let runStatus = run;
        while (status === 'queued' || status === 'in_progress') {
            await new Promise(res => setTimeout(res, 2000));
            const statusResp = await axios.get(
                `https://api.openai.com/v1/threads/${thread.id}/runs/${run.id}`,
                {
                    headers: {
                        'Authorization': `Bearer ${OPENAI_API_KEY}`,
                        'OpenAI-Beta': 'assistants=v2'
                    }
                }
            );
            runStatus = statusResp.data;
            status = runStatus.status;
        }
        if (runStatus.status !== 'completed') {
            return res.status(500).json({ error: 'Erro na execução do assistente' });
        }

        // 5. Busca a resposta
        const messagesResp = await axios.get(
            `https://api.openai.com/v1/threads/${thread.id}/messages`,
            {
                headers: {
                    'Authorization': `Bearer ${OPENAI_API_KEY}`,
                    'OpenAI-Beta': 'assistants=v2'
                }
            }
        );
        const messages = messagesResp.data;
        const assistantMessage = messages.data[0];

        res.json({ resposta: assistantMessage.content[0].text.value });

    } catch (e) {
        console.error("ERRO NO BACKEND:", e);
if (e.response && e.response.data) {
    console.error("OpenAI Response Error:", JSON.stringify(e.response.data, null, 2));
}

        res.status(500).json({ error: 'Erro no backend: ' + e.message });
    }
});

const PORT = 3001;
app.listen(PORT, () => {
    console.log(`Backend rodando em http://localhost:${PORT}`);
});
