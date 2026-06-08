import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { WebSocketServer } from "ws";
import Groq from "groq-sdk";

dotenv.config(); // Load environment variables from .env file

const app = express();
const PORT = process.env.PORT || 5000; // Use the port from .env or default to 3000

// Middleware
app.use(express.json());
// const allowedOrigins = ['http://127.0.0.1']; // On Development ***
const allowedOrigins = ["https://sinergiagdl.com"]; // On Production ***

const corsOptions = {
  origin: function (origin, callback) {
    if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  methods: ["GET", "POST"], // Add other methods if needed
  allowedHeaders: ["Content-Type", "Authorization"], // Add headers if needed
};

// app.use(cors()); // On Development ***
app.use(cors(corsOptions)); // On production ***

// Environment variables
const GROQ_API_BASE_URL = process.env.GROQ_API_BASE_URL; // Set in .env
const GROQ_API_KEY = process.env.GROQ_API_KEY; // Set in .env

const groq = new Groq({ apiKey: GROQ_API_KEY });

if (!GROQ_API_BASE_URL || !GROQ_API_KEY) {
  console.error(
    "Error: GROQ_API_BASE_URL and GROQ_API_KEY must be set in the .env file.",
  );
  process.exit(1);
}

// In-memory conversation storage
const conversations = {};

// Default context for the bot (Information about the person)
export const defaultContext = [
  {
  role: "system",
  content: `
  === INFORMACIÓN DEL NEGOCIO ===

  Empresa: Sinergia GDL
  Ubicación: Guadalajara, Jal. México
  Propietario/Coordinador: Eduardo Jasso
  Logo: Sinergia GDL

  === ESLOGAN DEL NEGOCIO ===

  Automatiza y Vende  
  AGENTES DE IA Y SOLUCIONES DIGITALES  
  Diseñamos e implementamos agentes de Inteligencia Artificial que automatizan procesos, gestionan tareas y optimizan operaciones. Desarrollamos plataformas web y aplicaciones móviles escalables listas para producción.

  === QUÉ HACEMOS ===

  Implementamos soluciones de Inteligencia Artificial que optimizan procesos, automatizan decisiones y transforman clientes potenciales en ventas. También desarrollamos plataformas web y aplicaciones que potencian estas capacidades.

  === CÓMO LO HACEMOS ===

  Analizamos el modelo de negocio, detectamos oportunidades de automatización y diseñamos sistemas inteligentes a medida.

  === POR QUÉ LO HACEMOS ===

  Porque la IA no es el futuro, es el presente. Ayudamos a las empresas a adoptar tecnología inteligente de forma estratégica, segura y rentable.

  === NUESTRO PROCESO ===

  01 Diagnóstico Estratégico  
  - Analizamos tu modelo de negocio, flujos operativos y datos disponibles para detectar oportunidades reales de automatización con IA.

  02 Desarrollo e Integración  
  - Construimos e integramos la solución de IA dentro de tus sistemas actuales garantizando rendimiento, seguridad y estabilidad.

  03 Pruebas y Optimización  
  - Validamos resultados y optimizamos precisión, tiempos de respuesta y costos operativos.

  04 Despliegue y Escalabilidad  
  - Implementamos la solución en producción y dejamos la infraestructura preparada para crecer junto con tu negocio.

  === TESTIMONIOS DE CLIENTES ===

  “La implementación de agentes de IA transformó completamente nuestros procesos internos. Reducimos tiempos operativos en un 40%.”  
  Carlos Méndez, CEO, Tech Solutions

  === CASOS DE USO DE IA ===

  - IA para Ventas  
    - Calificación automática de prospectos  
    - Seguimiento inteligente  
    - Integración con CRM

  - IA para Procesos Internos  
    - Automatización de reportes  
    - Asistentes empresariales  
    - Análisis de datos estratégico

  - IA para Atención al Cliente  
    - Soporte automatizado  
    - Gestión de tickets  
    - Experiencia omnicanal

  === PRODUCTOS / SERVICIOS (MXN) ===

  Implementaciones IA:  
  - Asesor interno / Atención a clientes / Asesor de ventas: Implementación desde 45,000 MXN +  
      - Paquete básico: $6,500 MXN mensuales  
      - Paquete intermedio: $11,500 MXN mensuales  
      - Paquete avanzado: $19,940 MXN mensuales  

  Desarrollo de Apps

  - Apps Informativas  
    - App Corporativa: desde $15,000 MXN  
    - App de Portafolio / Marca Personal: desde $18,000 MXN  
    - App de Noticias o Blog: desde $20,000 MXN

  - Apps Comerciales  
    - App E-commerce: desde $45,000 MXN  
    - App de Reservas / Citas: desde $35,000 MXN  
    - App de Suscripción: desde $40,000 MXN

  - Apps de Plataforma / Sistema  
    - App con Panel Administrativo: desde $50,000 MXN  
    - App tipo Marketplace: desde $80,000 MXN  
    - App SaaS / Sistema a Medida: desde $90,000 MXN

  - Apps de Comunidad / Interacción  
    - Red Social: desde $120,000 MXN  
    - App de Mensajería: desde $150,000 MXN  
    - Plataforma de Votación: desde $70,000 MXN

  - Apps Multimedia  
    - App de Podcast: desde $40,000 MXN  
    - App de Streaming: desde $180,000 MXN  
    - App de Cursos en Video: desde $85,000 MXN

  === MÉTODOS DE PAGO ===

  - Transferencia bancaria  
  - Depósito en tienda / OXXO  
  - Stripe  
  - PayPal  
  - Pago con tarjeta

  === PREGUNTAS FRECUENTES (FAQ’s) ===

  Q1: ¿Se necesita experiencia para usar las soluciones de IA?  
  A1: No se necesita experiencia previa. Nuestros agentes y plataformas están diseñados para ser fáciles de usar, con soporte y capacitación incluidos.

  Q2: ¿Qué tipo de soporte ofrecen?  
  A2: Ofrecemos soporte técnico y consultoría para garantizar que la solución se integre correctamente y funcione de manera óptima.

  Q3: ¿Las aplicaciones móviles son nativas o híbridas?  
  A3: Podemos desarrollar apps nativas para iOS y Android, así como aplicaciones híbridas según las necesidades del cliente.

  Q4: ¿Se pueden personalizar los paquetes de IA?  
  A4: Sí, cada paquete puede adaptarse según los requerimientos del negocio y el volumen de uso.

  Q5: ¿Qué plataformas de IA utilizan?  
  A5: Trabajamos con herramientas líderes del mercado y modelos propios según las necesidades del cliente.

  Q6: ¿Las soluciones de IA pueden integrarse con mi CRM?  
  A6: Sí, todas nuestras implementaciones pueden integrarse con sistemas existentes, incluyendo CRM y ERP.

  Q7: ¿Ofrecen capacitación para el equipo interno?  
  A7: Sí, ofrecemos entrenamiento completo para asegurar que el personal pueda usar las herramientas eficientemente.

  Q8: ¿Qué tipo de datos se requieren para entrenar un agente de IA?  
  A8: Documentos internos, historial de clientes, bases de datos y flujos operativos según el caso.

  Q9: ¿Pueden crear asistentes de voz o chatbots?  
  A9: Sí, desarrollamos chatbots y asistentes de voz personalizados.

  Q10: ¿Cómo se mide el éxito de la IA implementada?  
  A10: Medimos eficiencia, reducción de tiempos, calidad de respuestas y ROI en procesos internos o ventas.

  Q11: ¿Se puede implementar IA para atención al cliente 24/7?  
  A11: Sí, nuestros agentes pueden operar todo el tiempo con respuestas automáticas y personalizadas.

  Q12: ¿Qué tipo de apps móviles desarrollan?  
  A12: Apps informativas, comerciales, de plataforma, de comunidad y multimedia.

  Q13: ¿Se puede conectar la app con bases de datos existentes?  
  A13: Sí, podemos integrar cualquier sistema o base de datos que use la empresa.

  Q14: ¿Pueden integrarse con pagos en línea?  
  A14: Sí, soportamos Stripe, PayPal, tarjetas de crédito y otros métodos de pago.

  Q15: ¿Es posible actualizar la app después de su lanzamiento?  
  A15: Sí, ofrecemos mantenimiento y actualizaciones continuas.

  Q16: ¿Qué seguridad tienen las aplicaciones y agentes de IA?  
  A16: Implementamos protocolos de seguridad avanzados, encriptación de datos y buenas prácticas de privacidad.

  Q17: ¿Pueden desarrollar apps multiplataforma?  
  A17: Sí, apps híbridas que funcionan en iOS y Android.

  Q18: ¿Cuánto tiempo tarda una implementación de IA?  
  A18: Depende de la complejidad, típicamente entre 4 y 12 semanas.

  Q19: ¿Pueden automatizar procesos internos como reportes y seguimiento?  
  A19: Sí, creamos sistemas que generan reportes automáticos y seguimiento inteligente.

  Q20: ¿La IA puede integrarse con herramientas de marketing?  
  A20: Sí, se puede conectar con CRM, email marketing y otras plataformas.

  Q21: ¿Qué niveles de personalización tienen los paquetes de IA?  
  A21: Básico, intermedio y avanzado, adaptables según necesidades del negocio.

  Q22: ¿Pueden los agentes de IA gestionar clientes potenciales?  
  A22: Sí, califican leads, hacen seguimiento y gestionan conversaciones comerciales.

  Q23: ¿Se requiere infraestructura especial para la IA?  
  A23: No necesariamente, se puede implementar en la nube o en servidores existentes.

  Q24: ¿Ofrecen reportes de desempeño de la IA?  
  A24: Sí, entregamos reportes de métricas, KPIs y eficiencia.

  Q25: ¿Es posible integrar varias apps con la misma IA?  
  A25: Sí, nuestras soluciones son escalables y multi-plataforma.

  Q26: ¿Pueden los agentes de IA aprender con el tiempo?  
  A26: Sí, implementamos aprendizaje continuo y actualización de modelos.

  Q27: ¿Se puede implementar IA para ventas online y offline?  
  A27: Sí, adaptamos la IA a cualquier canal de ventas.

  Q28: ¿Ofrecen pruebas piloto antes de implementar?  
  A28: Sí, validamos la solución en un entorno controlado antes de producción.

  Q29: ¿Qué soporte post-implementación tienen?  
  A29: Soporte técnico, actualizaciones y optimización continua.

  Q30: ¿Pueden automatizar respuestas de email o chat?  
  A30: Sí, podemos automatizar respuestas de correo, chat web o apps.

  Q31: ¿La información de clientes está protegida?  
  A31: Sí, seguimos políticas estrictas de privacidad y protección de datos.

  Q32: ¿Se puede escalar la solución a más usuarios?  
  A32: Sí, la infraestructura está preparada para crecer según la demanda.

  Q33: ¿Pueden crear apps de streaming y multimedia?  
  A33: Sí, desarrollamos apps de audio, video y podcast.

  Q34: ¿Se puede vincular la app a redes sociales?  
  A34: Sí, integración con Facebook, Instagram, WhatsApp y otras plataformas.

  Q35: ¿Ofrecen asesoría en transformación digital?  
  A35: Sí, ayudamos a definir estrategias de IA y digitalización.

  Q36: ¿Qué pasa si la empresa cambia de procesos?  
  A36: Podemos adaptar la IA y las apps a los nuevos flujos de trabajo.

  Q37: ¿Se pueden automatizar reportes financieros?  
  A37: Sí, nuestras soluciones pueden generar reportes financieros y operativos.

  Q38: ¿Pueden los agentes de IA interactuar con clientes en varios idiomas?  
  A38: Sí, implementamos multilenguaje según necesidad.

  Q39: ¿Se pueden hacer apps personalizadas según industria?  
  A39: Sí, diseñamos soluciones específicas para cada sector.

  Q40: ¿La IA puede integrarse con sistemas de logística?  
  A40: Sí, automatizamos procesos internos y seguimiento de operaciones.

  Q41: ¿Pueden los agentes de IA analizar grandes volúmenes de datos?  
  A41: Sí, implementamos análisis de datos estratégicos y reportes automáticos.

  Q42: ¿Es posible integrar chatbots con WhatsApp y Messenger?  
  A42: Sí, nuestras soluciones soportan canales de mensajería populares.

  Q43: ¿Pueden los usuarios recibir notificaciones push desde la app?  
  A43: Sí, incluimos notificaciones push según los requerimientos.

  Q44: ¿Se puede medir el ROI de la IA implementada?  
  A44: Sí, entregamos métricas y reportes de eficiencia y resultados.

  Q45: ¿La app funciona sin conexión a internet?  
  A45: Algunas funcionalidades pueden estar disponibles offline según diseño.

  Q46: ¿Pueden integrarse con sistemas de facturación electrónica?  
  A46: Sí, nuestras apps pueden conectarse con sistemas contables y de facturación.

  Q47: ¿Ofrecen mantenimiento de apps después del lanzamiento?  
  A47: Sí, ofrecemos planes de mantenimiento y actualizaciones.

  Q48: ¿Se puede actualizar la IA con nuevos datos?  
  A48: Sí, los modelos pueden ser reentrenados y mejorados continuamente.

  Q49: ¿Se puede integrar IA para automatización de marketing?  
  A49: Sí, podemos crear flujos automatizados de marketing y ventas.

  Q50: ¿Qué ventajas ofrece implementar IA con Sinergia GDL?  
  A50: Reducción de tiempos operativos, eficiencia en ventas, automatización de procesos internos y soporte continuo.

  === FIN DE INFORMACIÓN DEL NEGOCIO ===
  `,
  },
  // {
  // role: "system",
  // content: `
  // You are a SALES BOT STRESS TEST GENERATOR.

  // Your job is NOT to sell.
  // Your job is NOT to answer questions.
  // Your job is to generate realistic client questions that will test a sales assistant configured with:

  // - Structured sales phases (qualification → proposal → escalation)
  // - Strict pricing rules (cannot invent prices)
  // - Escalation tool called need_human
  // - Strategic qualification requirements
  // - No invented timelines
  // - Must rely strictly on knowledge base
  // - Must detect when to escalate
  // - Must sell outcomes (growth, efficiency), not technology

  // The company being tested:
  // Sinergia GDL — IA agents and digital solutions.

  // They offer:
  // - AI implementations (from 45,000 MXN + monthly packages)
  // - App development (15,000 MXN to 180,000 MXN+)
  // - CRM integrations
  // - Automation of sales and internal processes
  // - Scalable AI systems
  // - Security protocols
  // - Payment integrations
  // - Support and training

  // Your objective:

  // When the user writes exactly:
  // sales test

  // You must:

  // 1. Analyze the business model and pricing structure.
  // 2. Identify potential weak points in sales flow:
  //    - Missing information
  //    - Budget ambiguity
  //    - Timeline pressure
  //    - Integration complexity
  //    - Enterprise-level requirements
  //    - Customization edge cases
  //    - Escalation triggers
  // 3. Generate 10 realistic, human-like, strategic test questions that:
  //    - Could challenge the sales bot
  //    - May require clarification
  //    - May push toward escalation
  //    - May test pricing integrity
  //    - May test integration limits
  //    - May test ROI claims
  //    - May test scalability
  // 4. Write them in Spanish.
  // 5. Number them 1–10.
  // 6. Do NOT answer them.
  // 7. No intro text.
  // 8. No explanations.
  // 9. No emojis.

  // Each execution must produce different question angles.

  // If the message is anything other than:
  // sales test

  // Respond exactly with:

  // This is for testing purposes only!

  // No additional words.
  // `
  // }
];

// Function to communicate with the GROQ API
async function getGroqChatCompletion(context) {
  return groq.chat.completions.create({
    messages: context,
    model: "llama-3.3-70b-versatile",
  });
}

app.post("/api/prompt", async (req, res) => {
  const { prompt, userId } = req.body;

  if (!userId) {
    return res
      .status(400)
      .json({ error: "userId is required to track conversations." });
  }

  try {
    // Initialize or retrieve the user's conversation history
    if (!conversations[userId]) {
      conversations[userId] = [];
    }

    const userConversation = conversations[userId];
    userConversation.push({ role: "user", content: prompt });

    const context = [...defaultContext, ...userConversation];

    const chatCompletion = await getGroqChatCompletion(context);

    if (!chatCompletion) {
      return res
        .status(500)
        .json({ error: "Failed to get a response from the GROQ API." });
    }

    const botResponse = chatCompletion.choices[0].message.content;
    userConversation.push({ role: "assistant", content: botResponse });

    res.json({ prompt, botResponse });
  } catch (error) {
    console.error("Error interacting with GROQ API:", error);
    res.status(500).json({ error: "An internal error occurred." });
  }
});

// WebSocket server for chat communication
const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Web Sockets Conection
const wss = new WebSocketServer({ server });

wss.on("connection", (ws) => {
  console.log("New client connected");
  ws.on("message", async (message) => {
    const { userId, prompt } = JSON.parse(message);
    console.log(`Received message from user ${userId}: ${prompt}`);
    try {
      // const response = await fetch("http://localhost:" + PORT + "/api/prompt", {   // On development ***
      const response = await fetch(
        "https://sinergia-asker-ia-server-1.onrender.com/api/prompt",
        {
          // On Production ***
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt, userId }),
        },
      );
      if (!response.ok) throw new Error("Server error");
      const data = await response.json();
      ws.send(JSON.stringify({ botResponse: data.botResponse }));
    } catch (error) {
      console.error(error);
      ws.send(JSON.stringify({ botResponse: `Error processing request` }));
    }
  });
  ws.on("close", () => {
    console.log("Client disconnected");
  });
});
