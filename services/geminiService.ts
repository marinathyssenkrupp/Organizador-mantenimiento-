import { GoogleGenAI, Schema } from "@google/genai";
import { MaintenanceRecord, Location, EquipmentType } from "../types";

const getAIClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({ apiKey });
};

// --- Analysis Logic ---
export const analyzeMaintenanceData = async (
  records: MaintenanceRecord[],
  monthLabel: string,
  location: string
): Promise<string> => {
  const ai = getAIClient();
  if (!ai) return "Error: API Key no encontrada.";

  // Simplify data for token efficiency
  const dataSummary = records.map(r => ({
    dia: r.date,
    hora: r.time,
    tec: r.technician,
    tipo: r.equipmentType,
    id_equipo: r.equipmentOrder
  }));

  const prompt = `
    Analiza la siguiente lista de mantenciones realizadas en ${location} durante ${monthLabel}.
    Responde en formato Markdown, sé breve y profesional.
    
    Tus objetivos:
    1. Resumir la cantidad total de mantenciones por tipo (Ascensor vs Escalera).
    2. Identificar si hay algún técnico que haya realizado la mayoría de los trabajos.
    3. Detectar si algún día específico hubo una carga de trabajo inusualmente alta.
    4. Dar una conclusión breve sobre el estado del mantenimiento este mes.

    Datos (JSON):
    ${JSON.stringify(dataSummary)}
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        thinkingConfig: { thinkingBudget: 0 } 
      }
    });
    return response.text || "No se pudo generar el análisis.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Ocurrió un error al analizar los datos con Gemini.";
  }
};

// --- Voice Assistant Logic ---

export const processVoiceCommand = async (audioBase64: string): Promise<Partial<MaintenanceRecord> | null> => {
    const ai = getAIClient();
    if (!ai) throw new Error("API Key no encontrada");

    // Clean base64 header if present
    const cleanBase64 = audioBase64.split(',')[1] || audioBase64;

    const prompt = `
    Escucha este audio de un técnico de mantenimiento y extrae los detalles para agendar una mantención.
    
    Fecha actual: ${new Date().toISOString().split('T')[0]}
    Hora actual: ${new Date().toLocaleTimeString('es-CL', {hour: '2-digit', minute:'2-digit'})}
    
    Reglas de Extracción:
    1. **Ubicación**: Debe ser exactamente una de estas: 'Marina', 'Boulevard', 'Ama'. Si dice "Mall", "Mol" o "Principal", usa 'Marina'.
    2. **Tipo**: 'Ascensor' o 'Escalera Mecánica'.
    3. **Técnico**: Busca nombres como Jose Krause, Javier Silva, Italo Sanhueza, Diego Vargas, Victor Jaramillo, Victor Gonzalez, Jorge Letelier, Cristian Guerrero, Julio Perez. Si no coincide exacto, usa el más parecido.
    4. **Fecha/Hora**: Si dice "hoy", usa la fecha actual. Si no especifica hora, usa la hora actual. Formato Fecha: YYYY-MM-DD. Formato Hora: HH:mm.
    5. **Equipo**: El nombre del equipo (ej: Torre Marina, Ripley, Estacionamiento).
    6. **Notas**: Cualquier detalle técnico extra (falla de frenos, revisión mensual, ruidos).

    Devuelve un JSON.
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: {
                parts: [
                    { inlineData: { mimeType: 'audio/webm', data: cleanBase64 } },
                    { text: prompt }
                ]
            },
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: "OBJECT",
                    properties: {
                        technician: { type: "STRING" },
                        location: { type: "STRING", enum: ["Marina", "Boulevard", "Ama"] },
                        equipmentType: { type: "STRING", enum: ["Ascensor", "Escalera Mecánica"] },
                        date: { type: "STRING" },
                        time: { type: "STRING" },
                        equipmentOrder: { type: "STRING" },
                        notes: { type: "STRING" }
                    },
                    required: ["technician", "location", "equipmentType", "date", "time", "equipmentOrder"]
                }
            }
        });

        const jsonText = response.text;
        if (!jsonText) return null;
        
        return JSON.parse(jsonText);
    } catch (error) {
        console.error("Error processing voice command:", error);
        return null;
    }
};

// --- Help/Guide Assistant Logic ---

export const askAssistant = async (userQuery: string): Promise<string> => {
  const ai = getAIClient();
  if (!ai) return "Error: No se pudo conectar con el servicio de IA.";

  const systemContext = `
    Eres el asistente experto de la aplicación "Gestor de Mantenciones Verticales".
    
    INFORMACIÓN DE LA APP:
    - **Propósito**: Organizar mantenciones de ascensores y escaleras mecánicas.
    - **Ubicaciones**: Mol Marina, Boulevard, Ama.
    - **Funcionalidades**:
      1. **Agregar Registro**: Botón "Nuevo". Se piden datos como Fecha, Hora, Técnico, Ubicación, Equipo.
      2. **Asistente de Voz**: Botón flotante (micrófono) abajo a la derecha. Permite dictar la mantención (ej: "José revisó el ascensor hoy").
      3. **Vistas**: Calendario (visual) y Lista (tabla detallada).
      4. **Exportar**: Menú "Exportar" para generar PDF (para Drive) o CSV (Excel), compartir por WhatsApp o Correo.
      5. **Análisis IA**: Botón "Analizar" que busca patrones en los datos del mes.
      6. **Notas de Audio**: Se pueden grabar notas de voz dentro de cada registro.
    
    Tu trabajo es responder preguntas del usuario sobre cómo usar la app de forma breve, amigable y en español.
    Si te preguntan algo fuera del contexto de la app, indica cortésmente que solo sabes de mantenciones.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: userQuery,
      config: {
        systemInstruction: systemContext,
      }
    });
    return response.text || "Lo siento, no pude generar una respuesta.";
  } catch (error) {
    console.error("Gemini Chat Error:", error);
    return "Hubo un error al procesar tu pregunta.";
  }
};
