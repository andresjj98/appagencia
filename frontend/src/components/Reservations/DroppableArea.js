import React from 'react';
import { useDrop } from 'react-dnd';
import { motion } from 'framer-motion';

const DroppableArea = ({ onDropComponent, children }) => {
  const [{ isOver }, drop] = useDrop(() => ({
    accept: 'COMPONENT',
    drop: (item) => onDropComponent(item.type),
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  }));

  return (
    <motion.div
      ref={drop}
      className={`min-h-[200px] border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center transition-all duration-200 ${
        isOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-gray-100'
      }`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {children.length > 0 ? (
        children
      ) : (
        <p className="text-gray-500 text-lg">Arrastra componentes aquí para construir la reserva</p>
      )}
    </motion.div>
  );
};

export default DroppableArea;