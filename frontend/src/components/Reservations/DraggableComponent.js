import React from 'react';
import { useDrag } from 'react-dnd';
import { motion } from 'framer-motion';

const DraggableComponent = ({ type, icon: Icon, label }) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'COMPONENT',
    item: { type },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }));

  return (
    <motion.div
      ref={drag}
      className={`p-4 border border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-grab transition-all duration-200 ${
        isDragging ? 'opacity-50 bg-blue-100' : 'bg-white hover:bg-gray-50'
      }`}
      whileHover={{ scale: 1.05, boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}
      whileTap={{ scale: 0.95 }}
    >
      <Icon className="w-8 h-8 text-blue-600 mb-2" />
      <span className="text-sm font-medium text-gray-700">{label}</span>
    </motion.div>
  );
};

export default DraggableComponent;