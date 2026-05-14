exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const { sector, empleados, areas, rol } = JSON.parse(event.body);

    const prompt = `Sos un especialista en automatización para empresas argentinas de la consultora Be+People.

Una empresa completó un diagnóstico con estos datos:
- Sector: ${sector}
- Cantidad de personas en el equipo: ${empleados}
- Áreas con más trabajo manual: ${areas}
- Rol del contacto: ${rol}

Respondé SOLO con un JSON válido, sin texto extra, con exactamente esta estructura:
{
  "procesos": [
    "descripción corta y específica del proceso automatizable 1 (máx 12 palabras)",
    "descripción corta y específica del proceso automatizable 2 (máx 12 palabras)",
    "descripción corta y específica del proceso automatizable 3 (máx 12 palabras)"
  ],
  "ahorro_horas": número entero entre 6 y 20,
  "ahorro_usd": número entero entre 600 and 2800,
  "semanas": número entero entre 3 y 8,
  "insight": "una frase directa en español rioplatense, específica para su sector y tamaño, que describe el principal cuello de botella que tienen hoy (máx 20 palabras)"
}

Reglas: los procesos deben ser específicos para el sector ${sector}, no genéricos. No uses "gestión de", usá verbos de acción: "clasificar", "procesar", "generar", "notificar", "registrar".`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5',
        max_tokens: 400,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    const data = await response.json();
    const text = data.content[0].text.trim();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON in response');
    const result = JSON.parse(jsonMatch[0]);

    return { statusCode: 200, headers, body: JSON.stringify(result) };
  } catch (err) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Error procesando diagnóstico', detail: err.message })
    };
  }
};
