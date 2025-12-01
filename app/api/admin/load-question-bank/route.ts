// app/api/admin/load-question-bank/route.ts
// Endpoint para cargar preguntas predefinidas en el banco maestro de preguntas
// PROTEGIDO: Solo accesible para administradores

import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { verifyAdminAuth } from "../../../lib/authHelpers";

// Cliente de Supabase (server-side) para operaciones de base de datos
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error("Faltan variables de entorno de Supabase");
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * Tipo para las preguntas predefinidas
 */
type QuestionSeed = {
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  correct_option: "A" | "B" | "C";
  category?: string;
  difficulty?: string;
};

/**
 * Array de preguntas predefinidas para el banco maestro
 * Total: 100 preguntas variadas en categorías y dificultades
 */
const PREDEFINED_QUESTIONS: QuestionSeed[] = [
  // Categoría: Lógica y tiempo (muy_facil)
  {
    question_text: "¿Cuál es el día que va entre lunes y miércoles?",
    option_a: "Martes",
    option_b: "Jueves",
    option_c: "Domingo",
    correct_option: "A",
    category: "logica",
    difficulty: "muy_facil",
  },
  {
    question_text: "¿Cuántos minutos tiene una hora?",
    option_a: "60",
    option_b: "30",
    option_c: "90",
    correct_option: "A",
    category: "tiempo",
    difficulty: "muy_facil",
  },
  {
    question_text: "Si respondes una pregunta al día durante 7 días, ¿cuántas preguntas habrás respondido?",
    option_a: "5",
    option_b: "7",
    option_c: "10",
    correct_option: "B",
    category: "logica",
    difficulty: "muy_facil",
  },
  {
    question_text: "¿Cuántos días tiene una semana?",
    option_a: "5",
    option_b: "6",
    option_c: "7",
    correct_option: "C",
    category: "tiempo",
    difficulty: "muy_facil",
  },
  {
    question_text: "¿Qué número viene después del 9?",
    option_a: "8",
    option_b: "10",
    option_c: "11",
    correct_option: "B",
    category: "logica",
    difficulty: "muy_facil",
  },
  {
    question_text: "¿Cuántas horas tiene un día completo?",
    option_a: "12",
    option_b: "24",
    option_c: "48",
    correct_option: "B",
    category: "tiempo",
    difficulty: "muy_facil",
  },
  {
    question_text: "Si hoy es lunes, ¿qué día será mañana?",
    option_a: "Domingo",
    option_b: "Martes",
    option_c: "Miércoles",
    correct_option: "B",
    category: "tiempo",
    difficulty: "muy_facil",
  },
  {
    question_text: "¿Cuántos meses tiene un año?",
    option_a: "10",
    option_b: "11",
    option_c: "12",
    correct_option: "C",
    category: "tiempo",
    difficulty: "muy_facil",
  },
  {
    question_text: "¿Qué número es mayor: 5 o 3?",
    option_a: "3",
    option_b: "5",
    option_c: "Son iguales",
    correct_option: "B",
    category: "logica",
    difficulty: "muy_facil",
  },
  {
    question_text: "¿Cuántos dedos tiene una mano?",
    option_a: "4",
    option_b: "5",
    option_c: "6",
    correct_option: "B",
    category: "logica",
    difficulty: "muy_facil",
  },

  // Categoría: Estilo de vida (facil)
  {
    question_text: "¿Cuántas comidas principales se recomienda hacer al día?",
    option_a: "2",
    option_b: "3",
    option_c: "5",
    correct_option: "B",
    category: "estilo_vida",
    difficulty: "facil",
  },
  {
    question_text: "¿Cuántos litros de agua se recomienda beber al día aproximadamente?",
    option_a: "1 litro",
    option_b: "2 litros",
    option_c: "5 litros",
    correct_option: "B",
    category: "estilo_vida",
    difficulty: "facil",
  },
  {
    question_text: "¿Cuántas horas de sueño se recomienda dormir por noche?",
    option_a: "4-5 horas",
    option_b: "7-9 horas",
    option_c: "12 horas",
    correct_option: "B",
    category: "estilo_vida",
    difficulty: "facil",
  },
  {
    question_text: "¿Cuál es el mejor momento del día para hacer ejercicio según los expertos?",
    option_a: "Solo por la noche",
    option_b: "Cualquier momento que puedas",
    option_c: "Solo por la mañana",
    correct_option: "B",
    category: "estilo_vida",
    difficulty: "facil",
  },
  {
    question_text: "¿Cuántos pasos diarios se recomienda caminar para mantener un estilo de vida activo?",
    option_a: "5.000 pasos",
    option_b: "10.000 pasos",
    option_c: "20.000 pasos",
    correct_option: "B",
    category: "estilo_vida",
    difficulty: "facil",
  },
  {
    question_text: "¿Qué porcentaje de frutas y verduras debería incluir una dieta equilibrada?",
    option_a: "Menos del 20%",
    option_b: "Alrededor del 50%",
    option_c: "Más del 80%",
    correct_option: "B",
    category: "estilo_vida",
    difficulty: "facil",
  },
  {
    question_text: "¿Cuánto tiempo se recomienda dedicar a actividades físicas moderadas por semana?",
    option_a: "30 minutos",
    option_b: "150 minutos",
    option_c: "300 minutos",
    correct_option: "B",
    category: "estilo_vida",
    difficulty: "facil",
  },
  {
    question_text: "¿Cuál es la mejor forma de mantener la constancia en los hábitos?",
    option_a: "Hacer cambios grandes de golpe",
    option_b: "Empezar con pequeños pasos",
    option_c: "Esperar a tener motivación",
    correct_option: "B",
    category: "habitos",
    difficulty: "facil",
  },
  {
    question_text: "¿Cuántas veces a la semana se recomienda hacer ejercicio de fuerza?",
    option_a: "1 vez",
    option_b: "2-3 veces",
    option_c: "7 veces",
    correct_option: "B",
    category: "estilo_vida",
    difficulty: "facil",
  },
  {
    question_text: "¿Qué es más importante para mantener un hábito: la motivación o la constancia?",
    option_a: "Solo la motivación",
    option_b: "La constancia",
    option_c: "Ambas por igual",
    correct_option: "B",
    category: "habitos",
    difficulty: "facil",
  },

  // Categoría: Hábitos y constancia (facil)
  {
    question_text: "¿Cuántos días se necesitan aproximadamente para formar un nuevo hábito?",
    option_a: "7 días",
    option_b: "21 días",
    option_c: "66 días",
    correct_option: "C",
    category: "habitos",
    difficulty: "facil",
  },
  {
    question_text: "¿Qué es más efectivo para crear un hábito: hacerlo a la misma hora o cuando te acuerdes?",
    option_a: "Cuando te acuerdes",
    option_b: "A la misma hora siempre",
    option_c: "No importa",
    correct_option: "B",
    category: "habitos",
    difficulty: "facil",
  },
  {
    question_text: "¿Cuál es el mejor momento para planificar el día siguiente?",
    option_a: "Por la mañana",
    option_b: "Por la noche",
    option_c: "A mediodía",
    correct_option: "B",
    category: "habitos",
    difficulty: "facil",
  },
  {
    question_text: "¿Cuántas tareas importantes se recomienda priorizar al día?",
    option_a: "10 o más",
    option_b: "1-3",
    option_c: "Ninguna",
    correct_option: "B",
    category: "habitos",
    difficulty: "facil",
  },
  {
    question_text: "¿Qué ayuda más a mantener la constancia: hacerlo solo o con apoyo?",
    option_a: "Siempre solo",
    option_b: "Con apoyo y comunidad",
    option_c: "No importa",
    correct_option: "B",
    category: "habitos",
    difficulty: "facil",
  },
  {
    question_text: "¿Es mejor hacer un hábito perfecto o hacerlo de forma constante aunque sea imperfecto?",
    option_a: "Perfecto siempre",
    option_b: "Constante aunque imperfecto",
    option_c: "No importa",
    correct_option: "B",
    category: "habitos",
    difficulty: "facil",
  },
  {
    question_text: "¿Cuánto tiempo se recomienda dedicar a una nueva actividad al principio?",
    option_a: "Mucho tiempo desde el inicio",
    option_b: "Poco tiempo y aumentar gradualmente",
    option_c: "No importa",
    correct_option: "B",
    category: "habitos",
    difficulty: "facil",
  },
  {
    question_text: "¿Qué es más importante: la cantidad o la calidad cuando empiezas un hábito?",
    option_a: "Solo la cantidad",
    option_b: "La constancia primero",
    option_c: "Solo la calidad",
    correct_option: "B",
    category: "habitos",
    difficulty: "facil",
  },
  {
    question_text: "¿Cuántos días seguidos se considera un 'streak' o racha exitosa?",
    option_a: "3 días",
    option_b: "7 días",
    option_c: "21 días",
    correct_option: "B",
    category: "habitos",
    difficulty: "facil",
  },
  {
    question_text: "¿Qué pasa si rompes una racha de hábitos?",
    option_a: "Todo está perdido",
    option_b: "Puedes empezar de nuevo",
    option_c: "No importa",
    correct_option: "B",
    category: "habitos",
    difficulty: "facil",
  },

  // Categoría: Conocimiento general (media)
  {
    question_text: "¿Cuántos continentes hay en el mundo?",
    option_a: "5",
    option_b: "6",
    option_c: "7",
    correct_option: "C",
    category: "conocimiento",
    difficulty: "media",
  },
  {
    question_text: "¿Cuál es el océano más grande del mundo?",
    option_a: "Atlántico",
    option_b: "Pacífico",
    option_c: "Índico",
    correct_option: "B",
    category: "conocimiento",
    difficulty: "media",
  },
  {
    question_text: "¿Cuántos planetas hay en nuestro sistema solar?",
    option_a: "7",
    option_b: "8",
    option_c: "9",
    correct_option: "B",
    category: "conocimiento",
    difficulty: "media",
  },
  {
    question_text: "¿Cuál es el río más largo del mundo?",
    option_a: "Amazonas",
    option_b: "Nilo",
    option_c: "Misisipi",
    correct_option: "A",
    category: "conocimiento",
    difficulty: "media",
  },
  {
    question_text: "¿Cuántos huesos tiene aproximadamente el cuerpo humano adulto?",
    option_a: "156",
    option_b: "206",
    option_c: "256",
    correct_option: "B",
    category: "conocimiento",
    difficulty: "media",
  },
  {
    question_text: "¿Cuál es la capital de España?",
    option_a: "Barcelona",
    option_b: "Madrid",
    option_c: "Valencia",
    correct_option: "B",
    category: "conocimiento",
    difficulty: "media",
  },
  {
    question_text: "¿Cuántos lados tiene un triángulo?",
    option_a: "2",
    option_b: "3",
    option_c: "4",
    correct_option: "B",
    category: "logica",
    difficulty: "media",
  },
  {
    question_text: "¿Cuál es el resultado de 2 + 2?",
    option_a: "3",
    option_b: "4",
    option_c: "5",
    correct_option: "B",
    category: "logica",
    difficulty: "muy_facil",
  },
  {
    question_text: "¿Cuántos segundos tiene un minuto?",
    option_a: "30",
    option_b: "60",
    option_c: "90",
    correct_option: "B",
    category: "tiempo",
    difficulty: "muy_facil",
  },
  {
    question_text: "¿Qué día viene después del viernes?",
    option_a: "Jueves",
    option_b: "Sábado",
    option_c: "Domingo",
    correct_option: "B",
    category: "tiempo",
    difficulty: "muy_facil",
  },

  // Más preguntas de lógica (muy_facil y facil)
  {
    question_text: "¿Cuál es el resultado de 5 × 2?",
    option_a: "7",
    option_b: "10",
    option_c: "12",
    correct_option: "B",
    category: "logica",
    difficulty: "muy_facil",
  },
  {
    question_text: "¿Cuántos meses tienen 31 días?",
    option_a: "5",
    option_b: "7",
    option_c: "12",
    correct_option: "B",
    category: "tiempo",
    difficulty: "facil",
  },
  {
    question_text: "¿Qué número es la mitad de 20?",
    option_a: "8",
    option_b: "10",
    option_c: "12",
    correct_option: "B",
    category: "logica",
    difficulty: "muy_facil",
  },
  {
    question_text: "¿Cuántas semanas tiene aproximadamente un mes?",
    option_a: "3",
    option_b: "4",
    option_c: "5",
    correct_option: "B",
    category: "tiempo",
    difficulty: "facil",
  },
  {
    question_text: "¿Cuál es el resultado de 10 - 3?",
    option_a: "5",
    option_b: "7",
    option_c: "8",
    correct_option: "B",
    category: "logica",
    difficulty: "muy_facil",
  },
  {
    question_text: "¿Cuántos días tiene febrero en un año normal?",
    option_a: "28",
    option_b: "29",
    option_c: "30",
    correct_option: "A",
    category: "tiempo",
    difficulty: "facil",
  },
  {
    question_text: "¿Qué número viene antes del 15?",
    option_a: "13",
    option_b: "14",
    option_c: "16",
    correct_option: "B",
    category: "logica",
    difficulty: "muy_facil",
  },
  {
    question_text: "¿Cuántas estaciones tiene un año?",
    option_a: "2",
    option_b: "3",
    option_c: "4",
    correct_option: "C",
    category: "tiempo",
    difficulty: "muy_facil",
  },
  {
    question_text: "¿Cuál es el resultado de 3 × 3?",
    option_a: "6",
    option_b: "9",
    option_c: "12",
    correct_option: "B",
    category: "logica",
    difficulty: "muy_facil",
  },
  {
    question_text: "¿Cuántos días tiene un año normal?",
    option_a: "360",
    option_b: "365",
    option_c: "370",
    correct_option: "B",
    category: "tiempo",
    difficulty: "facil",
  },

  // Más preguntas de estilo de vida y hábitos
  {
    question_text: "¿Cuántas veces al día se recomienda cepillarse los dientes?",
    option_a: "1 vez",
    option_b: "2 veces",
    option_c: "4 veces",
    correct_option: "B",
    category: "estilo_vida",
    difficulty: "facil",
  },
  {
    question_text: "¿Cuánto tiempo se recomienda esperar después de comer antes de hacer ejercicio intenso?",
    option_a: "Inmediatamente",
    option_b: "1-2 horas",
    option_c: "5 horas",
    correct_option: "B",
    category: "estilo_vida",
    difficulty: "facil",
  },
  {
    question_text: "¿Cuál es la mejor forma de hidratarse durante el ejercicio?",
    option_a: "Beber mucha agua de golpe",
    option_b: "Beber pequeños sorbos regularmente",
    option_c: "No beber nada",
    correct_option: "B",
    category: "estilo_vida",
    difficulty: "facil",
  },
  {
    question_text: "¿Cuántas horas antes de dormir se recomienda evitar pantallas?",
    option_a: "30 minutos",
    option_b: "1 hora",
    option_c: "2 horas",
    correct_option: "B",
    category: "estilo_vida",
    difficulty: "facil",
  },
  {
    question_text: "¿Qué es más importante para la salud: ejercicio o descanso?",
    option_a: "Solo ejercicio",
    option_b: "Equilibrio entre ambos",
    option_c: "Solo descanso",
    correct_option: "B",
    category: "estilo_vida",
    difficulty: "facil",
  },
  {
    question_text: "¿Cuántas veces a la semana se recomienda hacer ejercicio cardiovascular?",
    option_a: "1 vez",
    option_b: "3-5 veces",
    option_c: "7 veces",
    correct_option: "B",
    category: "estilo_vida",
    difficulty: "facil",
  },
  {
    question_text: "¿Cuál es la mejor hora para tomar el desayuno?",
    option_a: "No importa",
    option_b: "En las primeras 2 horas tras despertar",
    option_c: "A mediodía",
    correct_option: "B",
    category: "estilo_vida",
    difficulty: "facil",
  },
  {
    question_text: "¿Cuántos minutos de exposición al sol se recomienda al día para vitamina D?",
    option_a: "5 minutos",
    option_b: "15-20 minutos",
    option_c: "2 horas",
    correct_option: "B",
    category: "estilo_vida",
    difficulty: "facil",
  },
  {
    question_text: "¿Cuál es la mejor postura para trabajar frente al ordenador?",
    option_a: "Encorbado",
    option_b: "Espalda recta, pantalla a la altura de los ojos",
    option_c: "Acostado",
    correct_option: "B",
    category: "estilo_vida",
    difficulty: "facil",
  },
  {
    question_text: "¿Cuántas veces al día se recomienda hacer pausas si trabajas sentado?",
    option_a: "Nunca",
    option_b: "Cada 30-60 minutos",
    option_c: "Una vez al día",
    correct_option: "B",
    category: "estilo_vida",
    difficulty: "facil",
  },

  // Más preguntas de hábitos
  {
    question_text: "¿Cuál es el mejor momento para revisar tus objetivos?",
    option_a: "Nunca",
    option_b: "Regularmente, al menos semanalmente",
    option_c: "Solo una vez al año",
    correct_option: "B",
    category: "habitos",
    difficulty: "facil",
  },
  {
    question_text: "¿Qué es más efectivo: un hábito grande o varios pequeños?",
    option_a: "Solo uno grande",
    option_b: "Varios pequeños y manejables",
    option_c: "No importa",
    correct_option: "B",
    category: "habitos",
    difficulty: "facil",
  },
  {
    question_text: "¿Cuánto tiempo se recomienda dedicar a la lectura diaria para crear el hábito?",
    option_a: "5 minutos",
    option_b: "15-20 minutos",
    option_c: "2 horas",
    correct_option: "B",
    category: "habitos",
    difficulty: "facil",
  },
  {
    question_text: "¿Qué ayuda más a recordar un hábito: una alarma o un recordatorio visual?",
    option_a: "Solo alarma",
    option_b: "Ambos combinados",
    option_c: "Solo recordatorio visual",
    correct_option: "B",
    category: "habitos",
    difficulty: "facil",
  },
  {
    question_text: "¿Es mejor hacer un hábito a la misma hora o cuando tengas tiempo?",
    option_a: "Cuando tengas tiempo",
    option_b: "A la misma hora siempre",
    option_c: "No importa",
    correct_option: "B",
    category: "habitos",
    difficulty: "facil",
  },
  {
    question_text: "¿Cuántos hábitos nuevos se recomienda empezar a la vez?",
    option_a: "10 o más",
    option_b: "1-2",
    option_c: "Ninguno",
    correct_option: "B",
    category: "habitos",
    difficulty: "facil",
  },
  {
    question_text: "¿Qué es más importante al crear un hábito: la duración o la frecuencia?",
    option_a: "Solo la duración",
    option_b: "La frecuencia primero",
    option_c: "Solo la frecuencia",
    correct_option: "B",
    category: "habitos",
    difficulty: "facil",
  },
  {
    question_text: "¿Cuál es la mejor forma de celebrar un logro en un hábito?",
    option_a: "No celebrar nada",
    option_b: "Reconocer el progreso, por pequeño que sea",
    option_c: "Solo celebrar logros grandes",
    correct_option: "B",
    category: "habitos",
    difficulty: "facil",
  },
  {
    question_text: "¿Qué hacer si te saltas un día de tu hábito?",
    option_a: "Abandonar completamente",
    option_b: "Retomarlo al día siguiente",
    option_c: "Esperar una semana",
    correct_option: "B",
    category: "habitos",
    difficulty: "facil",
  },
  {
    question_text: "¿Cuánto tiempo se recomienda dedicar a la meditación diaria para empezar?",
    option_a: "30 minutos",
    option_b: "5-10 minutos",
    option_c: "1 hora",
    correct_option: "B",
    category: "habitos",
    difficulty: "facil",
  },

  // Más preguntas de conocimiento general
  {
    question_text: "¿Cuál es el animal más grande del mundo?",
    option_a: "Elefante",
    option_b: "Ballena azul",
    option_c: "Jirafa",
    correct_option: "B",
    category: "conocimiento",
    difficulty: "media",
  },
  {
    question_text: "¿Cuántos colores tiene el arcoíris?",
    option_a: "5",
    option_b: "6",
    option_c: "7",
    correct_option: "C",
    category: "conocimiento",
    difficulty: "facil",
  },
  {
    question_text: "¿Cuál es la montaña más alta del mundo?",
    option_a: "K2",
    option_b: "Everest",
    option_c: "Kilimanjaro",
    correct_option: "B",
    category: "conocimiento",
    difficulty: "media",
  },
  {
    question_text: "¿Cuántos países tiene aproximadamente Europa?",
    option_a: "30",
    option_b: "44",
    option_c: "60",
    correct_option: "B",
    category: "conocimiento",
    difficulty: "media",
  },
  {
    question_text: "¿Cuál es el país más grande del mundo por superficie?",
    option_a: "China",
    option_b: "Rusia",
    option_c: "Estados Unidos",
    correct_option: "B",
    category: "conocimiento",
    difficulty: "media",
  },
  {
    question_text: "¿Cuántas letras tiene el alfabeto español?",
    option_a: "26",
    option_b: "27",
    option_c: "28",
    correct_option: "B",
    category: "conocimiento",
    difficulty: "facil",
  },
  {
    question_text: "¿Cuál es el resultado de 4 × 4?",
    option_a: "12",
    option_b: "16",
    option_c: "20",
    correct_option: "B",
    category: "logica",
    difficulty: "muy_facil",
  },
  {
    question_text: "¿Cuántos lados tiene un cuadrado?",
    option_a: "3",
    option_b: "4",
    option_c: "5",
    correct_option: "B",
    category: "logica",
    difficulty: "muy_facil",
  },
  {
    question_text: "¿Cuál es el resultado de 6 ÷ 2?",
    option_a: "2",
    option_b: "3",
    option_c: "4",
    correct_option: "B",
    category: "logica",
    difficulty: "muy_facil",
  },
  {
    question_text: "¿Cuántos días tiene una quincena?",
    option_a: "10 días",
    option_b: "15 días",
    option_c: "20 días",
    correct_option: "B",
    category: "tiempo",
    difficulty: "facil",
  },
];

export async function POST(request: NextRequest) {
  try {
    // 1) Verificar autenticación de administrador (solo en producción)
    const isProduction = process.env.NODE_ENV === "production";
    
    if (isProduction) {
      // En producción, verificar autenticación
      const auth = await verifyAdminAuth(request);
      if (!auth.ok) {
        const statusCode = auth.error === "not_authenticated" ? 401 : 403;
        return NextResponse.json(
          { success: false, error: auth.error || "not_authenticated" },
          { status: statusCode }
        );
      }
    } else {
      // En desarrollo, saltar autenticación
      console.log("⚠️ load-question-bank sin auth (modo desarrollo)");
    }

    console.log("📝 Iniciando carga de preguntas predefinidas en el banco maestro...");

    // 2) Convertir preguntas predefinidas al formato de la base de datos
    const questionsToInsert = PREDEFINED_QUESTIONS.map((q) => ({
      question_text: q.question_text,
      option_a: q.option_a,
      option_b: q.option_b,
      option_c: q.option_c,
      correct_option: q.correct_option,
      category: q.category || null,
      difficulty: q.difficulty || null,
    }));

    // 3) Insertar preguntas en r4w_question_bank
    // NOTA: Mantenemos las preguntas existentes y añadimos estas nuevas.
    // Si prefieres borrar las existentes primero, puedes usar:
    // await supabase.from("r4w_question_bank").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    // Pero por defecto, simplemente añadimos las nuevas preguntas.
    
    const { data: insertedData, error: insertError } = await supabase
      .from("r4w_question_bank")
      .insert(questionsToInsert)
      .select("id");

    if (insertError) {
      console.error("❌ Error insertando preguntas en r4w_question_bank:", {
        message: insertError.message || "Error desconocido",
        details: insertError.details || "Sin detalles",
        hint: insertError.hint || "Sin hint",
        code: insertError.code || "Sin código",
        error: insertError,
      });
      return NextResponse.json(
        {
          success: false,
          error: "supabase_error",
        },
        { status: 500 }
      );
    }

    const insertedCount = insertedData?.length || 0;
    console.log(`✅ ${insertedCount} preguntas insertadas correctamente en r4w_question_bank`);

    // 4) Devolver resultado
    return NextResponse.json({
      success: true,
      inserted: insertedCount,
      mode: "local_seed",
    });
  } catch (error: any) {
    console.error("❌ Error crítico en load-question-bank:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Error desconocido",
      },
      { status: 500 }
    );
  }
}

