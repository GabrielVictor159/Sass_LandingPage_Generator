"use client"
import React, { useState, useRef, useEffect } from "react";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import styles from "./page.module.css";

interface ComponentType {
  id: number;
  type: "title" | "image" | "button";
  gridPosition: { x: number; y: number };
  content?: string;
}

interface GridType {
  id: number;
  components: ComponentType[];
  width: number;
  height: number;
  divisions: divisionType[];
}

interface divisionType {
  x: number;
  y: number;
  colspaceX: number;
  colspaceY: number;
}

const DraggableComponent: React.FC<{ type: string }> = ({ type }) => {
  const dragRef = useRef<HTMLDivElement | null>(null);
  const [{ isDragging }, drag] = useDrag({
    type: "component",
    item: { type },
    collect: (monitor) => ({ isDragging: !!monitor.isDragging() }),
  });

  useEffect(() => {
    if (dragRef.current) {
      drag(dragRef.current);
    }
  }, [drag]);

  return (
    <div ref={dragRef} className={styles.draggable} style={{ opacity: isDragging ? 0.5 : 1 }}>
      {type.toUpperCase()}
    </div>
  );
};

const DropArea: React.FC<{
  grid: GridType;
  onDrop: (gridId: number, item: ComponentType) => void;
  updateGrid: (gridId: number, components: ComponentType[], width: number, height: number, divisions: divisionType[]) => void;
}> = ({ grid, onDrop, updateGrid }) => {
  const dropRef = useRef<HTMLDivElement | null>(null);

  const [, drop] = useDrop({
    accept: "component",
    drop: (item: { type: string }, monitor) => {
      if (dropRef.current) {
        const { x: clientX, y: clientY } = monitor.getClientOffset() || { x: 0, y: 0 };
        const rect = dropRef.current.getBoundingClientRect();

        let colIndex = Math.floor((clientX - rect.left) / (rect.width / grid.divisions.reduce((sum, div) => sum + div.colspaceX, 0)));
        let rowIndex = Math.floor((clientY - rect.top) / (rect.height / grid.divisions.reduce((sum, div) => sum + div.colspaceY, 0)));

        console.log("newItem", { x: colIndex, y: rowIndex });
        onDrop(grid.id, {
          id: Date.now(),
          type: item.type as ComponentType["type"],
          gridPosition: { x: colIndex, y: rowIndex },
          content: item.type === "title" ? "Título Editável" : item.type === "button" ? "Clique Aqui" : "",
        });
      }
    },
  });

  useEffect(() => {
    if (dropRef.current) {
      drop(dropRef.current);
    }
  }, [drop]);

  const handleContentChange = (id: number, newContent: string) => {
    updateGrid(
      grid.id,
      grid.components.map((comp) => (comp.id === id ? { ...comp, content: newContent } : comp)),
      grid.width,
      grid.height,
      grid.divisions
    );
  };
  const gridStyle = {
    width: `${grid.width}px`,
    height: `${grid.height}px`,
    display: "grid",
    gridTemplateColumns: `repeat(${grid.divisions.reduce((sum, div) => sum + div.colspaceX, 0)}, 1fr)`,
    gridTemplateRows: `repeat(${grid.divisions.reduce((sum, div) => sum + div.colspaceY, 0)}, 1fr)`,
    border: "1px solid #ccc",
  };

  const getItensPosition = (positionX: number, positionY: number): ComponentType[] => {
    return grid.components.filter((comp) => comp.gridPosition.x === positionX && comp.gridPosition.y === positionY);
  };

  return (
    <div ref={dropRef} className={styles.dropArea} style={gridStyle}>
      {Number.isFinite(grid.divisions.reduce((sum, div) => sum + div.colspaceX, 0)) &&
        Number.isFinite(grid.divisions.reduce((sum, div) => sum + div.colspaceY, 0)) &&
        grid.divisions.length > 0 && (
          [...Array(grid.divisions.reduce((sum, div) => sum + div.colspaceX, 0))].map((_, rowIndex) =>
            [...Array(grid.divisions.reduce((sum, div) => sum + div.colspaceY, 0))].map((_, colIndex) => (
              <div key={`${rowIndex}-${colIndex}`} className={styles.droppedItem}>
                {getItensPosition(colIndex, rowIndex).map((comp) => (
                  <div key={comp.id} className={styles.component}>
                    {comp.type === "title" ? (
                      <input type="text" className={styles.input} value={comp.content} onChange={(e) => handleContentChange(comp.id, e.target.value)} />
                    ) : comp.type === "button" ? (
                      <button className={styles.button} onClick={() => alert("Botão Clicado!")}>{comp.content}</button>
                    ) : comp.type === "image" ? (
                      <div className="border p-2">[Imagem Aqui]</div>
                    ) : null}
                  </div>
                ))}
              </div>
            ))
          )
        )}
    </div>
  );
};

const LandingPages: React.FC = () => {
  const [grids, setGrids] = useState<GridType[]>([
    { id: Date.now(), components: [], width: 300, height: 200, divisions: [{ x: 0, y: 0, colspaceX: 1, colspaceY: 1 }] },
  ]);
  const [selectedGrid, setSelectedGrid] = useState<GridType | null>(null);

  const handleDrop = (gridId: number, component: ComponentType) => {
    setGrids((prev) =>
      prev.map((grid) =>
        grid.id === gridId ? { ...grid, components: [...grid.components, component] } : grid
      )
    );
  };

  const addGrid = () => {
    setGrids((prev) => [
      ...prev,
      { id: Date.now(), components: [], width: 300, height: 200, divisions: [{ x: 0, y: 0, colspaceX: 1, colspaceY: 1 }] },
    ]);
  };

  const updateGrid = (gridId: number, components: ComponentType[], width: number, height: number, divisions: divisionType[]) => {
    setGrids((prev) =>
      prev.map((grid) =>
        grid.id === gridId ? { ...grid, components, width, height, divisions } : grid
      )
    );
  };

  const handleGridSizeChange = (gridId: number, width: number, height: number) => {
    setGrids((prev) =>
      prev.map((grid) => (grid.id === gridId ? { ...grid, width, height } : grid))
    );
    setSelectedGrid((prev) => (prev && prev.id === gridId ? { ...prev, width, height } : prev));
  };

  const addNewDivisions = (gridId: number, valueX: number, valueY: number) => {
    console.log("valueX", valueX);
    console.log("valueY", valueY);
    let existingMaxValues = getMaxValues(gridId);
    console.log("existingMaxValues", existingMaxValues);
    if (selectedGrid?.id === gridId) {

      const updatedDivisions = [...selectedGrid.divisions];

      let diferenceX = valueX - existingMaxValues.maxX;
      let diferenceY = valueY - existingMaxValues.maxY;

      if(diferenceX > 0) {
        for (let i = 0; i < diferenceX; i++) {
          for (let y = 0; y <= existingMaxValues.maxY; y++) {
            updatedDivisions.push({ x: existingMaxValues.maxX + i + 1, y, colspaceX: 1, colspaceY: 1 });
          }
        }
      }
      if(diferenceX<0){
        let itemsDelete = updatedDivisions.filter(item => item.x+(item.colspaceX-1) > valueX);
        itemsDelete.forEach((itemDelete)=>{
          updatedDivisions.splice(updatedDivisions.indexOf(itemDelete), 1);
        })
      }
      if(diferenceY > 0) {
        for (let i = 0; i < diferenceY; i++) {
          for (let x = 0; x <= existingMaxValues.maxX; x++) {
            updatedDivisions.push({ x, y: existingMaxValues.maxY + i + 1, colspaceX: 1, colspaceY: 1 });
          }
        }
      }
      if(diferenceY<0){
        let itemsDelete = updatedDivisions.filter(item => item.y+(item.colspaceY-1) > valueY);
        itemsDelete.forEach((itemDelete)=>{
          updatedDivisions.splice(updatedDivisions.indexOf(itemDelete), 1);
        })
      }
      console.log("updatedDivisions", updatedDivisions);
      setSelectedGrid((prev) => (prev ? { ...prev, divisions: updatedDivisions } : prev));
      updateGrid(gridId, selectedGrid.components, selectedGrid.width, selectedGrid.height, updatedDivisions);
    }
  };


  const getMaxValues = (gridId: number) :  { maxX: number, maxY: number } => {
    let maxX = 0;
    let maxY = 0;
    if (selectedGrid?.id === gridId) {
      selectedGrid.divisions.forEach((item) => {
        maxX = Math.max(maxX, item.x + (item.colspaceX - 1));
        maxY = Math.max(maxY, item.y + (item.colspaceY - 1));
      });
    }
    return { maxX, maxY }
  }

  const handleSelectGrid = (gridId: number) => {
    setSelectedGrid(grids.find((grid) => grid.id === gridId) || null);
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className={styles.container}>
        <div className={styles.sidebar}>
          <DraggableComponent type="title" />
          <DraggableComponent type="image" />
          <DraggableComponent type="button" />
        </div>
        <div className={styles.gridArea}>
          {grids.map((grid) => (
            <div key={grid.id} className={styles.gridItem} onClick={() => handleSelectGrid(grid.id)}>
              <DropArea grid={grid} onDrop={handleDrop} updateGrid={updateGrid} />
            </div>
          ))}
          <button onClick={addGrid}>Adicionar Grid</button>
        </div>
        {/* faltou arrumar essa parte */}
        <div>
          <h3>Editar Componente</h3>
          {selectedGrid && (
            <div className={styles.gridControls}>
              <label className={styles.label}>
                Largura:
                <input
                  type="number"
                  value={selectedGrid.width}
                  onChange={(e) => handleGridSizeChange(selectedGrid.id, parseInt(e.target.value), selectedGrid.height)}
                />
              </label >
              <label className={styles.label}>
                Altura:
                <input
                  type="number"
                  value={selectedGrid.height}
                  onChange={(e) => handleGridSizeChange(selectedGrid.id, selectedGrid.width, parseInt(e.target.value))}
                />
              </label>
              <label className={styles.label}>
                Divisões:
                <input
                  type="number"
                  value={getMaxValues(selectedGrid?.id).maxX}
                  onChange={(e) => addNewDivisions(selectedGrid?.id, Number(e.target.value),getMaxValues(selectedGrid?.id).maxX)}
                />
                <input
                  type="number"
                  value={getMaxValues(selectedGrid?.id).maxY}
                  onChange={(e) => addNewDivisions(selectedGrid?.id,getMaxValues(selectedGrid?.id).maxY, Number(e.target.value))}
                />

              </label>
            </div>
          )}
        </div>
      </div>
    </DndProvider>
  );
};

export default LandingPages;
