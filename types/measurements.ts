export interface UserMeasurements {
  userId: string;
  task_set_url?: string;
  manual_input?: string;
  volume_params: {
    abdomen: number;
    alternative_waist_girth: number;
    ankle: number;
    armscye_girth: number;
    bicep: number;
    calf: number;
    chest: number;
    elbow_girth: number;
    forearm: number;
    high_hips: number;
    knee: number;
    low_hips: number;
    mid_thigh_girth: number;
    neck: number;
    neck_girth: number;
    neck_girth_relaxed: number;
    overarm_girth: number;
    pant_waist: number;
    thigh: number;
    thigh_1_inch_below_crotch: number;
    under_bust_girth: number;
    upper_bicep_girth: number;
    upper_chest_girth: number;
    upper_knee_girth: number;
    waist: number;
    waist_gray: number;
    waist_green: number;
    wrist: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface MeasurementField {
  key: keyof UserMeasurements['volume_params'];
  label: string;
  unit: string;
  min: number;
  max: number;
  description: string;
  category: 'chest' | 'waist' | 'hips' | 'arms' | 'legs' | 'neck';
}

export const measurementFields: MeasurementField[] = [
  // Chest & Upper Body
  { key: 'chest', label: 'Chest', unit: 'inches', min: 20, max: 60, description: 'Measure around the fullest part of your chest', category: 'chest' },
  { key: 'upper_chest_girth', label: 'Upper Chest', unit: 'inches', min: 15, max: 55, description: 'Measure around upper chest area', category: 'chest' },
  { key: 'under_bust_girth', label: 'Under Bust', unit: 'inches', min: 15, max: 50, description: 'Measure directly under the bust line', category: 'chest' },
  
  // Waist & Core
  { key: 'waist', label: 'Waist', unit: 'inches', min: 20, max: 50, description: 'Measure around your natural waistline', category: 'waist' },
  { key: 'pant_waist', label: 'Pant Waist', unit: 'inches', min: 20, max: 50, description: 'Measure where you wear your pants', category: 'waist' },
  { key: 'abdomen', label: 'Abdomen', unit: 'inches', min: 20, max: 60, description: 'Measure around the fullest part of your abdomen', category: 'waist' },
  { key: 'alternative_waist_girth', label: 'Alternative Waist', unit: 'inches', min: 20, max: 50, description: 'Alternative waist measurement', category: 'waist' },
  { key: 'waist_gray', label: 'Waist (Gray)', unit: 'inches', min: 20, max: 50, description: 'Alternative waist measurement point', category: 'waist' },
  { key: 'waist_green', label: 'Waist (Green)', unit: 'inches', min: 20, max: 50, description: 'Alternative waist measurement point', category: 'waist' },
  
  // Hips
  { key: 'high_hips', label: 'High Hips', unit: 'inches', min: 25, max: 60, description: 'Measure around the high hip area', category: 'hips' },
  { key: 'low_hips', label: 'Low Hips', unit: 'inches', min: 25, max: 60, description: 'Measure around the fullest part of your hips', category: 'hips' },
  
  // Arms
  { key: 'bicep', label: 'Bicep', unit: 'inches', min: 8, max: 25, description: 'Measure around the fullest part of your bicep', category: 'arms' },
  { key: 'upper_bicep_girth', label: 'Upper Bicep', unit: 'inches', min: 8, max: 25, description: 'Measure around upper bicep area', category: 'arms' },
  { key: 'forearm', label: 'Forearm', unit: 'inches', min: 6, max: 20, description: 'Measure around the fullest part of your forearm', category: 'arms' },
  { key: 'wrist', label: 'Wrist', unit: 'inches', min: 4, max: 12, description: 'Measure around your wrist', category: 'arms' },
  { key: 'armscye_girth', label: 'Armscye', unit: 'inches', min: 10, max: 25, description: 'Measure around the armhole', category: 'arms' },
  { key: 'overarm_girth', label: 'Overarm', unit: 'inches', min: 10, max: 30, description: 'Measure over the arm', category: 'arms' },
  { key: 'elbow_girth', label: 'Elbow', unit: 'inches', min: 6, max: 20, description: 'Measure around your elbow', category: 'arms' },
  
  // Legs
  { key: 'thigh', label: 'Thigh', unit: 'inches', min: 12, max: 35, description: 'Measure around the fullest part of your thigh', category: 'legs' },
  { key: 'thigh_1_inch_below_crotch', label: 'Thigh (1" Below Crotch)', unit: 'inches', min: 12, max: 35, description: 'Measure thigh 1 inch below crotch', category: 'legs' },
  { key: 'mid_thigh_girth', label: 'Mid Thigh', unit: 'inches', min: 10, max: 30, description: 'Measure around mid-thigh area', category: 'legs' },
  { key: 'knee', label: 'Knee', unit: 'inches', min: 8, max: 25, description: 'Measure around your knee', category: 'legs' },
  { key: 'upper_knee_girth', label: 'Upper Knee', unit: 'inches', min: 8, max: 25, description: 'Measure around upper knee area', category: 'legs' },
  { key: 'calf', label: 'Calf', unit: 'inches', min: 8, max: 25, description: 'Measure around the fullest part of your calf', category: 'legs' },
  { key: 'ankle', label: 'Ankle', unit: 'inches', min: 6, max: 15, description: 'Measure around your ankle', category: 'legs' },
  
  // Neck
  { key: 'neck', label: 'Neck', unit: 'inches', min: 10, max: 25, description: 'Measure around your neck', category: 'neck' },
  { key: 'neck_girth', label: 'Neck Girth', unit: 'inches', min: 10, max: 25, description: 'Measure neck circumference', category: 'neck' },
  { key: 'neck_girth_relaxed', label: 'Neck Girth (Relaxed)', unit: 'inches', min: 10, max: 25, description: 'Measure neck in relaxed position', category: 'neck' },
];

export const measurementCategories = {
  chest: { label: 'Chest & Upper Body', icon: '👕' },
  waist: { label: 'Waist & Core', icon: '📏' },
  hips: { label: 'Hips', icon: '🔄' },
  arms: { label: 'Arms', icon: '💪' },
  legs: { label: 'Legs', icon: '🦵' },
  neck: { label: 'Neck', icon: '👔' },
};