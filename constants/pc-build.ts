import { Cpu, MonitorCheck, CircuitBoard, MemoryStick, HardDrive, Zap, Box, Wind, Package } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { PcPartType } from '@prisma/client'

export const partTypeIconComponents: Record<PcPartType, LucideIcon> = {
  CPU: Cpu,
  GPU: MonitorCheck,
  MOTHERBOARD: CircuitBoard,
  RAM: MemoryStick,
  STORAGE: HardDrive,
  PSU: Zap,
  CASE: Box,
  COOLER: Wind,
  OTHER: Package,
}
