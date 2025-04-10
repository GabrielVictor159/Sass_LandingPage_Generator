import React, { useRef, useEffect } from "react";
import { useDrag } from "react-dnd";

const DraggableComponent: React.FC<{ type: string; id?: number }> = ({ type, id }) => {
  const dragRef = useRef<HTMLDivElement>(null);

  const [{ isDragging }, drag] = useDrag({
    type: "component",
    item: () => ({
      type,
      id,
    }),
    canDrag: () => true,
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  });

  useEffect(() => {
    if (dragRef.current) {
      drag(dragRef.current);
    }
  }, [drag]);

  return (
    <div
      ref={dragRef}
      className="draggable"
      style={{ opacity: isDragging ? 0.5 : 1 }}
    >
      {type.toUpperCase()}
    </div>
  );
};


export default DraggableComponent;