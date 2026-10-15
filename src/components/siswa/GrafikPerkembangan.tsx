import React from 'react';
import { SiswaGrafikPerkembangan } from './SiswaGrafikPerkembangan';

interface GrafikPerkembanganProps {
  username: string;
  nama: string;
  kelas: string;
  onNavigateToMisi?: () => void;
}

export const GrafikPerkembangan: React.FC<GrafikPerkembanganProps> = ({
  username,
  nama,
  onNavigateToMisi = () => {}
}) => {
  return (
    <SiswaGrafikPerkembangan
      username={username}
      nama={nama}
      onNavigateToMisi={onNavigateToMisi}
    />
  );
};
