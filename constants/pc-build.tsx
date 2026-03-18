'use client'

import { Cpu, MonitorCheck, CircuitBoard, MemoryStick, HardDrive, Zap, Box, Wind, Package } from 'lucide-react'
import type { PcPartType } from '@prisma/client'

export const partTypeIcons: Record<PcPartType, React.ReactNode> = {
  CPU: <Cpu className="w-4 h-4" />,
  GPU: <MonitorCheck className="w-4 h-4" />,
  MOTHERBOARD: <CircuitBoard className="w-4 h-4" />,
  RAM: <MemoryStick className="w-4 h-4" />,
  STORAGE: <HardDrive className="w-4 h-4" />,
  PSU: <Zap className="w-4 h-4" />,
  CASE: <Box className="w-4 h-4" />,
  COOLER: <Wind className="w-4 h-4" />,
  OTHER: <Package className="w-4 h-4" />,
}
