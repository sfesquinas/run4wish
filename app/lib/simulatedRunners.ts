// app/lib/simulatedRunners.ts
// Funciones para gestionar runners simulados

import { supabase } from "./supabaseClient";

const TOTAL_RUNNERS = 100;
const RACE_TYPE = "7d_mvp";

/**
 * Genera un nombre de runner simulado
 */
function generateRunnerName(index: number): string {
  const prefixes = ["Runner", "Speed", "Focus", "Dream", "Constante", "R4W"];
  const prefix = prefixes[index % prefixes.length];
  const number = String(index + 1).padStart(2, "0");
  return `${prefix}_${number}`;
}

/**
 * Genera speed_factor según distribución:
 * - 20 runners rápidos (1.3-1.8)
 * - 60 runners normales (0.7-1.2)
 * - 20 runners lentos (0.3-0.6)
 */
function generateSpeedFactor(index: number): number {
  if (index < 20) {
    // Rápidos: 1.3 - 1.8
    return Number((Math.random() * 0.5 + 1.3).toFixed(2));
  } else if (index < 80) {
    // Normales: 0.7 - 1.2
    return Number((Math.random() * 0.5 + 0.7).toFixed(2));
  } else {
    // Lentos: 0.3 - 0.6
    return Number((Math.random() * 0.3 + 0.3).toFixed(2));
  }
}

/**
 * Genera los 100 runners simulados para una carrera
 * Solo los crea si no existen ya
 */
export async function ensureSimulatedRunners(): Promise<boolean> {
  try {
    // Verificar si ya existen runners para esta carrera
    const { count, error: countError } = await supabase
      .from("r4w_simulated_runners")
      .select("*", { count: "exact", head: true })
      .eq("race_type", RACE_TYPE);

    if (countError) {
      console.error("❌ Error verificando runners simulados:");
      console.error("Mensaje:", countError.message);
      console.error("Detalles:", countError.details);
      console.error("Hint:", countError.hint);
      console.error("Código:", countError.code);
      
      // Verificar si la tabla no existe
      if (countError.message?.includes("relation") || countError.message?.includes("does not exist")) {
        console.error("⚠️ La tabla r4w_simulated_runners no existe. Ejecuta la migración SQL: supabase_migration_simulated_runners.sql");
      }
      
      return false;
    }

    // Si ya hay runners, no hacer nada
    if (count && count >= TOTAL_RUNNERS) {
      console.log(`✅ Ya existen ${count} runners simulados para ${RACE_TYPE}`);
      return true;
    }

    // Generar runners
    const runners = [];
    for (let i = 0; i < TOTAL_RUNNERS; i++) {
      runners.push({
        display_name: generateRunnerName(i),
        speed_factor: generateSpeedFactor(i),
        race_type: RACE_TYPE,
      });
    }

    // Insertar en lote
    const { data: insertedRunners, error: insertError } = await supabase
      .from("r4w_simulated_runners")
      .insert(runners)
      .select();

    if (insertError) {
      console.error("❌ Error insertando runners simulados:");
      console.error("Mensaje:", insertError.message);
      console.error("Detalles:", insertError.details);
      console.error("Hint:", insertError.hint);
      console.error("Código:", insertError.code);
      console.error("Error completo:", JSON.stringify(insertError, Object.getOwnPropertyNames(insertError)));
      
      // Verificar si la tabla existe
      if (insertError.message?.includes("relation") || insertError.message?.includes("does not exist")) {
        console.error("⚠️ La tabla r4w_simulated_runners no existe. Ejecuta la migración SQL: supabase_migration_simulated_runners.sql");
      }
      
      return false;
    }
    
    if (!insertedRunners || insertedRunners.length !== TOTAL_RUNNERS) {
      console.warn(`⚠️ Se esperaban ${TOTAL_RUNNERS} runners, se insertaron ${insertedRunners?.length || 0}`);
    }

    console.log(`✅ Generados ${TOTAL_RUNNERS} runners simulados para ${RACE_TYPE}`);
    return true;
  } catch (error) {
    console.error("Error en ensureSimulatedRunners:", error);
    return false;
  }
}

/**
 * Simula el progreso diario de todos los runners
 * Calcula cuántos puestos adelantan según su speed_factor
 */
export async function simulateDailyProgress(dayNumber: number): Promise<boolean> {
  try {
    // Obtener todos los runners
    const { data: runners, error: runnersError } = await supabase
      .from("r4w_simulated_runners")
      .select("id, speed_factor")
      .eq("race_type", RACE_TYPE);

    if (runnersError || !runners) {
      console.error("Error obteniendo runners:", runnersError);
      return false;
    }

    // Verificar si ya se simuló este día
    const { data: existingPositions, error: existingError } = await supabase
      .from("r4w_simulated_positions")
      .select("runner_id")
      .eq("day_number", dayNumber)
      .limit(1);

    if (existingError) {
      console.error("Error verificando posiciones existentes:", existingError);
      return false;
    }

    if (existingPositions && existingPositions.length > 0) {
      console.log(`✅ El día ${dayNumber} ya fue simulado`);
      return true;
    }

    // Calcular posiciones ganadas para cada runner
    const positions = runners.map((runner) => {
      // Base: entre 0 y 5 puestos según speed_factor
      // Runners más rápidos ganan más puestos
      const baseGain = Math.floor(runner.speed_factor * 5);
      // Añadir algo de aleatoriedad
      const randomFactor = Math.floor(Math.random() * 3) - 1; // -1, 0, o 1
      const positionsGained = Math.max(0, baseGain + randomFactor);

      return {
        runner_id: runner.id,
        day_number: dayNumber,
        answered: true,
        positions_gained: positionsGained,
      };
    });

    // Insertar posiciones
    const { error: insertError } = await supabase
      .from("r4w_simulated_positions")
      .insert(positions);

    if (insertError) {
      console.error("Error insertando posiciones simuladas:", insertError);
      return false;
    }

    console.log(`✅ Simulado progreso del día ${dayNumber} para ${runners.length} runners`);
    return true;
  } catch (error) {
    console.error("Error en simulateDailyProgress:", error);
    return false;
  }
}

/**
 * Calcula la posición total de un runner simulado hasta un día específico
 */
export async function getRunnerTotalPositions(
  runnerId: string,
  upToDay: number
): Promise<number> {
  try {
    const { data, error } = await supabase
      .from("r4w_simulated_positions")
      .select("positions_gained")
      .eq("runner_id", runnerId)
      .lte("day_number", upToDay);

    if (error || !data) {
      return 0;
    }

    // Sumar todas las posiciones ganadas
    return data.reduce((sum, pos) => sum + (pos.positions_gained || 0), 0);
  } catch (error) {
    console.error("Error calculando posiciones totales:", error);
    return 0;
  }
}

/**
 * Obtiene el ranking combinado (runners simulados ordenados por posiciones totales)
 */
export async function getSimulatedRanking(upToDay: number): Promise<
  Array<{
    id: string;
    display_name: string;
    total_positions: number;
    speed_factor: number;
  }>
> {
  try {
    // Obtener todos los runners con sus posiciones acumuladas
    const { data: runners, error: runnersError } = await supabase
      .from("r4w_simulated_runners")
      .select("id, display_name, speed_factor")
      .eq("race_type", RACE_TYPE);

    if (runnersError || !runners) {
      console.error("Error obteniendo runners:", runnersError);
      return [];
    }

    // Calcular posiciones totales para cada runner
    const rankings = await Promise.all(
      runners.map(async (runner) => {
        const totalPositions = await getRunnerTotalPositions(runner.id, upToDay);
        return {
          id: runner.id,
          display_name: runner.display_name,
          total_positions: totalPositions,
          speed_factor: runner.speed_factor,
        };
      })
    );

    // Ordenar por posiciones totales (mayor a menor)
    rankings.sort((a, b) => b.total_positions - a.total_positions);

    return rankings;
  } catch (error) {
    console.error("Error obteniendo ranking simulado:", error);
    return [];
  }
}

/**
 * Calcula cuántos puestos adelantó el usuario real comparado con runners simulados
 * Basado en el día actual y las posiciones de los runners
 */
export async function calculateUserAdvance(
  userAnsweredCorrectly: boolean,
  currentDay: number
): Promise<number> {
  if (!userAnsweredCorrectly) {
    return 0;
  }

  try {
    // Simular progreso diario si no existe
    await simulateDailyProgress(currentDay);

    // Obtener ranking simulado hasta el día actual
    const currentRanking = await getSimulatedRanking(currentDay);

    // Calcular posición estimada del usuario basada en días respondidos
    // El usuario tiene un rendimiento medio-alto: 3-5 puestos por día
    const userEstimatedPositions = currentDay * (3 + Math.random() * 2); // Entre 3 y 5 por día

    // Contar cuántos runners tienen menos posiciones acumuladas que el usuario
    const runnersBehind = currentRanking.filter(
      (r) => r.total_positions < userEstimatedPositions
    ).length;

    // El avance es proporcional a cuántos runners quedaron atrás
    // Base: entre 3 y 8 puestos
    const baseAdvance = Math.floor(Math.random() * 6) + 3;
    
    // Bonus según el día (los primeros días es más fácil adelantar)
    const dayBonus = currentDay <= 3 ? 2 : currentDay <= 5 ? 1 : 0;
    
    // Ajuste según runners detrás (más realista)
    const runnersFactor = Math.min(Math.floor(runnersBehind / 10), 2);
    
    return baseAdvance + dayBonus + runnersFactor;
  } catch (error) {
    console.error("Error calculando avance del usuario:", error);
    // Fallback: valor aleatorio entre 3 y 10
    return Math.floor(Math.random() * 8) + 3;
  }
}

