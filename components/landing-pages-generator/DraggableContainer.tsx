import React, { useRef, useState, useEffect } from "react";
import { useDrag, useDrop } from "react-dnd";
import styles from "./LadingPagesGeneratorStyles.module.css";
import DraggableComponent from "./DraggableComponent";

interface DraggableContainerProps {
  id: number;
  type: string;
  left: number;
  top: number;
  width?: number;
  height?: number;
  childrenComponents: ComponentType[];
  onDropChild: (parentId: number, component: ComponentType) => void;
  onMoveChild: (parentId: number, compId: number, left: number, top: number) => void;
  onResize?: (id: number, width: number, height: number, parentId?: number) => void;
  parentId?: number;
}

const DraggableContainer: React.FC<DraggableContainerProps> = ({
  id,
  type,
  left,
  top,
  width: initialWidth = 200,
  height: initialHeight = 200,
  childrenComponents,
  onDropChild,
  onMoveChild,
  onResize,
  parentId,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const resizeHandleRef = useRef<HTMLDivElement>(null);
  const moveHandleRef = useRef<HTMLDivElement>(null);

  const [width, setWidth] = useState(initialWidth);
  const [height, setHeight] = useState(initialHeight);
  const [isEditing, setIsEditing] = useState(false);
  const [position, setPosition] = useState({ left, top });

  const [, drag] = useDrag({
    type: "component",
    item: { type, id },
  });

  useEffect(() => {
    setPosition({ left, top });
  }, [left, top]);

  const [, drop] = useDrop({
    accept: "component",
    drop: (item: { type: string; id?: number }, monitor) => {
      const offset = monitor.getClientOffset();
      const boundingRect = containerRef.current?.getBoundingClientRect();

      if (offset && boundingRect) {
        const newLeft = offset.x - boundingRect.left;
        const newTop = offset.y - boundingRect.top;

        const newComponent = {
          id: Date.now(),
          type: item.type as "title" | "image" | "button" | "container",
          left: newLeft,
          top: newTop,
        };

        item.id
          ? onMoveChild(id, item.id, newLeft, newTop)
          : onDropChild(id, newComponent);
      }
    },
  });
  
  

  drop(containerRef);

  // Redimensionar
  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      if (!isEditing) return;

      e.preventDefault();
      const startX = e.clientX;
      const startY = e.clientY;
      const startWidth = width;
      const startHeight = height;

      const onMouseMove = (e: MouseEvent) => {
        const newWidth = Math.max(100, startWidth + (e.clientX - startX));
        const newHeight = Math.max(100, startHeight + (e.clientY - startY));
        setWidth(newWidth);
        setHeight(newHeight);
        onResize?.(id, newWidth, newHeight, parentId);
      };

      const onMouseUp = () => {
        window.removeEventListener("mousemove", onMouseMove);
        window.removeEventListener("mouseup", onMouseUp);
      };

      window.addEventListener("mousemove", onMouseMove);
      window.addEventListener("mouseup", onMouseUp);
    };

    const resizeEl = resizeHandleRef.current;
    resizeEl?.addEventListener("mousedown", handleMouseDown);

    return () => {
      resizeEl?.removeEventListener("mousedown", handleMouseDown);
    };
  }, [width, height, id, onResize, isEditing]);

  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      if (!isEditing) return;

      e.preventDefault();
      const startX = e.clientX;
      const startY = e.clientY;

      const onMouseMove = (e: MouseEvent) => {
        const newLeft = position.left + (e.clientX - startX);
        const newTop = position.top + (e.clientY - startY);
        setPosition({ left: newLeft, top: newTop });
        onMoveChild(parentId || id, id, newLeft, newTop);
      };

      const onMouseUp = () => {
        window.removeEventListener("mousemove", onMouseMove);
        window.removeEventListener("mouseup", onMouseUp);
      };

      window.addEventListener("mousemove", onMouseMove);
      window.addEventListener("mouseup", onMouseUp);
    };

    const moveEl = moveHandleRef.current;
    moveEl?.addEventListener("mousedown", handleMouseDown);

    return () => {
      moveEl?.removeEventListener("mousedown", handleMouseDown);
    };
  }, [position, id, onMoveChild, parentId, isEditing]);

  return (
    <>
    <div
      ref={containerRef}
      className={styles.draggableContainer}
      style={{
        position: "absolute",
        left: position.left,
        top: position.top,
        width,
        height,
        backgroundColor: "#fefefe",
        border: isEditing ? "2px dashed #0099ff" : "1px solid #aaa",
      }}
      onDoubleClick={() => setIsEditing(!isEditing)}
    >
      {childrenComponents.map((child) => (
        <div
          key={child.id}
          style={{
            position: "relative",
            transform: `translate(${child.left}px, ${child.top}px)`,
          }}
        >
          {child.type === "container" ? (
            <DraggableContainer
              id={child.id}
              type={child.type}
              left={child.left}
              top={child.top}
              width={child.width}
              height={child.height}
              childrenComponents={child.children || []}
              onDropChild={onDropChild}
              onMoveChild={onMoveChild}
              onResize={(childId, w, h) => {
                onResize?.(childId, w, h, id);
              }}
              parentId={id}
            />
          ) : (
            <DraggableComponent type={child.type} id={child.id} />
          )}
        </div>
      ))}

      {isEditing && (
        <>
          <div
            ref={resizeHandleRef}
            style={{
              position: "absolute",
              right: 0,
              bottom: 0,
              width: 16,
              height: 16,
              background: "#333",
              cursor: "nwse-resize",
            }}
          />
          <div
            ref={moveHandleRef}
            style={{
              position: "absolute",
              left: "calc(50% - 8px)",
              top: "calc(50% - 8px)",
              width: 16,
              height: 16,
              background: "#0066cc",
              borderRadius: "50%",
              cursor: "move",
            }}
          />
        </>
      )}
    </div>
    </>
  );
};
export default DraggableContainer;