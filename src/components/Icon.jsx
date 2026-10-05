import React from 'react';
import * as Icons from 'lucide-react';

export default function Icon({ name, size = 18, color, className = '' }) {
  const IconComponent = Icons[name] || Icons.CircleDot;
  return <IconComponent size={size} color={color} className={className} />;
}
