import { create } from 'zustand';
import { SimulationInput, SimulationOutput } from '../types/wheel';
import { calculateWheelPhysics } from '../lib/physicsEngine';

interface WheelStore {
  input: SimulationInput;
  output: SimulationOutput;
  updateInput: <K extends keyof SimulationInput>(key: K, value: SimulationInput[K]) => void;
  setPreset: (presetId: SimulationInput['rimPresetId']) => void;
  applyHubPreset: (type: 'rim_front' | 'disc_front' | 'rim_rear' | 'disc_rear') => void;
  resetToDefaults: () => void;
}

const defaultInput: SimulationInput = {
  hubType: 'rear',
  rimPresetId: 'carbon_38',
  riderWeightKg: 70,
  powerWatts: 0,
  spokeCount: 24,
  initialTensionN: 1100,
  dsPcdMm: 58,
  ndsPcdMm: 44,
  dsOffsetMm: 19,
  ndsOffsetMm: 37,
  dsCrossCount: 3,
  ndsCrossCount: 2,
  lacingRatio: '1:1',
  isDiscBrake: false,
};

export const useWheelStore = create<WheelStore>((set) => ({
  input: { ...defaultInput },
  output: calculateWheelPhysics(defaultInput),

  updateInput: (key, value) => {
    set((state) => {
      const newInput = { ...state.input, [key]: value };
      
      // Auto-logic based on Hub Type switching
      if (key === 'hubType') {
        const type = value as 'front' | 'rear';
        if (type === 'front') {
          newInput.powerWatts = 0; // Front has no drivetrain torque!
          newInput.lacingRatio = '1:1'; // Front has no 2:1 lacing
          // Load default Front presets based on disc status
          const isDisc = newInput.isDiscBrake;
          newInput.dsPcdMm = isDisc ? 40 : 38;
          newInput.ndsPcdMm = isDisc ? 56 : 38;
          newInput.dsOffsetMm = isDisc ? 34 : 38;
          newInput.ndsOffsetMm = isDisc ? 22 : 38;
        } else {
          // Load default Rear presets
          const isDisc = newInput.isDiscBrake;
          newInput.dsPcdMm = 58;
          newInput.ndsPcdMm = isDisc ? 52 : 44;
          newInput.dsOffsetMm = isDisc ? 21 : 19;
          newInput.ndsOffsetMm = isDisc ? 32 : 37;
        }
      }

      // Auto adjust presets or dependencies if needed when disc is clicked
      if (key === 'isDiscBrake') {
        const isDisc = value as boolean;
        const isFr = newInput.hubType === 'front';
        if (isFr) {
          newInput.dsPcdMm = isDisc ? 40 : 38;
          newInput.ndsPcdMm = isDisc ? 56 : 38;
          newInput.dsOffsetMm = isDisc ? 34 : 38;
          newInput.ndsOffsetMm = isDisc ? 22 : 38;
        } else {
          newInput.dsPcdMm = 58;
          newInput.ndsPcdMm = isDisc ? 52 : 44;
          newInput.dsOffsetMm = isDisc ? 21 : 19;
          newInput.ndsOffsetMm = isDisc ? 32 : 37;
        }
      }

      return {
        input: newInput,
        output: calculateWheelPhysics(newInput),
      };
    });
  },

  setPreset: (presetId) => {
    set((state) => {
      const newInput = { ...state.input, rimPresetId: presetId };
      return {
        input: newInput,
        output: calculateWheelPhysics(newInput),
      };
    });
  },

  applyHubPreset: (presetType) => {
    set((state) => {
      const isDisc = presetType.startsWith('disc_');
      const isFr = presetType.endsWith('_front');
      
      const newInput: SimulationInput = {
        ...state.input,
        hubType: isFr ? 'front' : 'rear',
        isDiscBrake: isDisc,
        lacingRatio: isFr ? '1:1' : state.input.lacingRatio,
        powerWatts: isFr ? 0 : state.input.powerWatts,
        
        // Expose correct preset values
        dsPcdMm: isFr ? (isDisc ? 40 : 38) : 58,
        ndsPcdMm: isFr ? (isDisc ? 56 : 38) : (isDisc ? 52 : 44),
        dsOffsetMm: isFr ? (isDisc ? 34 : 38) : (isDisc ? 21 : 19),
        ndsOffsetMm: isFr ? (isDisc ? 22 : 38) : (isDisc ? 32 : 37),
      };

      return {
        input: newInput,
        output: calculateWheelPhysics(newInput),
      };
    });
  },

  resetToDefaults: () => {
    set({
      input: { ...defaultInput },
      output: calculateWheelPhysics(defaultInput),
    });
  },
}));
