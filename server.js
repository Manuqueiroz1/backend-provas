const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const OPENAI_API_KEY = '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'; // Coloque sua key AQUI! (NUNCA no frontend!)

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
            { assistant_id: 'asst_vMreVgrscbgjXqP8ihGlqb9P' }, // Coloque seu Assistant ID aqui
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
        console.error(e);
        res.status(500).json({ error: 'Erro no backend: ' + e.message });
    }
});

const PORT = 3001;
app.listen(PORT, () => {
    console.log(`Backend rodando em http://localhost:${PORT}`);
});
