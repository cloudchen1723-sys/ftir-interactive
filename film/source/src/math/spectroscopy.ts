/**
 * Molecular Vibrational Spectroscopy Model
 * Real physical models for molecular degrees of freedom, harmonic oscillator vibrations,
 * and dipole moment derivative (d mu / d Q) selection rules.
 */

export interface MolecularMode {
  id: string;
  nameEn: string;
  nameZh: string;
  wavenumber: number; // cm^-1
  type: 'stretching-sym' | 'stretching-asym' | 'bending' | 'scissoring';
  isIrActive: boolean;
  dipoleReasonEn: string;
  dipoleReasonZh: string;
}

export const MOLECULAR_MODES: MolecularMode[] = [
  {
    id: 'diatomic-stretch',
    nameEn: 'Diatomic Bond Oscillation',
    nameZh: '双原子伸缩简谐振动',
    wavenumber: 2143, // e.g. CO
    type: 'stretching-sym',
    isIrActive: true,
    dipoleReasonEn: 'Bond stretching induces periodic dipole variation dμ/dQ ≠ 0',
    dipoleReasonZh: '键长伸缩引发偶极矩动态改变 (dμ/dQ ≠ 0)，具有红外活性',
  },
  {
    id: 'co2-sym-stretch',
    nameEn: 'CO₂ Symmetric Stretch (ν₁)',
    nameZh: '二氧化碳 对称伸缩振动 (ν₁)',
    wavenumber: 1388,
    type: 'stretching-sym',
    isIrActive: false,
    dipoleReasonEn: 'Both oxygen dipoles cancel out symmetrically. Net dipole remains 0: IR-INACTIVE',
    dipoleReasonZh: '两个偶极矩变化方向相反完全抵消，净偶极矩始终为零：无红外活性',
  },
  {
    id: 'co2-asym-stretch',
    nameEn: 'CO₂ Asymmetric Stretch (ν₃)',
    nameZh: '二氧化碳 不对称伸缩振动 (ν₃)',
    wavenumber: 2349,
    type: 'stretching-asym',
    isIrActive: true,
    dipoleReasonEn: 'One C=O bond contracts while other expands. Produces powerful dynamic dipole moment',
    dipoleReasonZh: '一个碳氧键压缩同时另一个伸长，产生强烈的动态跃迁偶极矩',
  },
  {
    id: 'co2-bend',
    nameEn: 'CO₂ Bending / Scissoring (ν₂)',
    nameZh: '二氧化碳 简并弯曲振动 (ν₂)',
    wavenumber: 667,
    type: 'bending',
    isIrActive: true,
    dipoleReasonEn: 'Bending breaks linearity perpendicular to molecular axis, oscillating net dipole',
    dipoleReasonZh: '弯曲振动破坏线性对称，在垂直轴方向形成周期性振荡偶极矩',
  },
  {
    id: 'carbonyl-c-o',
    nameEn: 'Carbonyl C=O Intense Stretch',
    nameZh: '羰基 C=O 极性伸缩振动',
    wavenumber: 1715,
    type: 'stretching-sym',
    isIrActive: true,
    dipoleReasonEn: 'High electronegativity difference creates huge transition dipole: signature diagnostic peak',
    dipoleReasonZh: '高电负性差形成巨大跃迁偶极矩，成为特征性极强的诊断官能团峰',
  },
];
