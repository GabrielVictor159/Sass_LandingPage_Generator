"use client"
import React, { useState, useRef, useEffect } from "react";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import styles from "./page.module.css";

interface ComponentType {
  id: number;
  type: "title" | "image" | "button";
  content?: string;
}

interface GridType {
  id: number;
  width: number;
  height: number;
  divisions: divisionType[];
}

interface divisionType {
  id: number;
  x: number;
  y: number;
  components: ComponentType[];
  colspaceX: number;
  colspaceY: number;
}

const DraggableComponent: React.FC<{ type: string }> = ({ type }) => {
  const dragRef = useRef<HTMLDivElement>(null);

  const [{ isDragging }, drag] = useDrag({
    type: "component",
    item: { type },
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


const DropArea: React.FC<{
  grid: GridType;
  onDrop: (gridId: number, item: ComponentType, divisionId:number|undefined) => void;
  updateGrid: (gridId: number, width: number, height: number, divisions: divisionType[]) => void;
  getMaxValues: (gridId: number) => { maxX: number; maxY: number };
}> = ({ grid, onDrop, updateGrid, getMaxValues }) => {
  const dropRef = useRef<HTMLDivElement | null>(null);
  const [maxValues, setMaxValues] = useState<{ maxX: number; maxY: number }>();

  useEffect(() => {
    setMaxValues(getMaxValues(grid.id));
    console.log("grid", grid);
  }, [grid]);

  const [, drop] = useDrop({
    accept: "component",
    drop: (item: { type: string }, monitor) => {
      //resolver o bug de dropar em cima de outro componente
      if (dropRef.current) {
        const { x: clientX, y: clientY } = monitor.getClientOffset() || { x: 0, y: 0 };
        const rect = dropRef.current.getBoundingClientRect();

        const colWidth = grid.width / (maxValues?.maxX || 1);
        const rowHeight = grid.height / (maxValues?.maxY || 1);

        let colIndex = Math.floor((clientX - rect.left) / colWidth);
        let rowIndex = Math.floor((clientY - rect.top) / rowHeight);

        let division = grid.divisions.find(e=>e.x === colIndex && e.y === rowIndex);

        onDrop(grid.id, {
          id: Date.now(),
          type: item.type as ComponentType["type"],
          content: item.type === "title" ? "Título Editável" : item.type === "button" ? "Clique Aqui" : "",
        },division?.id);
      }
    },
  });

  useEffect(() => {
    if (dropRef.current && maxValues) {
      drop(dropRef.current);
    }
  }, [drop, maxValues]);


  const handleContentChange = (id: number, newContent: string) => {
    updateGrid(
      grid.id,
      grid.width,
      grid.height,
      grid.divisions
    );
  };

  const containerStyle: React.CSSProperties = {
    width: `${grid.width}px`,
    height: `${grid.height}px`,
    position: "relative",
    border: "1px solid #ccc",
  };

  const mapComponents = (column: number, row: number) => {
    let division = grid.divisions.find((div) => div.x === column && div.y === row);
    if (division) {
      return division.components.map((comp, index) => {
        return (
          <div key={`componente-${column}-${row}-${index}`} className={styles.component}>
            {comp.type === "title" ? (
              <input type="text" className={styles.input} value={comp.content} onChange={(e) => handleContentChange(comp.id, e.target.value)} />
            ) : comp.type === "button" ? (
              <button className={styles.button} onClick={() => alert("Botão Clicado!")}>{comp.content}</button>
            ) : comp.type === "image" ? (
              <div className="border p-2">[Imagem Aqui]</div>
            ) : null}
          </div>
        );
      });
    }
  };

  const mapColumns = (line: number) => {
    const columns = [];
    for (let i = 0; i < maxValues!.maxX; i++) {
      columns.push(
        <div
          key={`column-${line}-${i}`}
          className={styles.columns}
        >
          <div
            key={`dropedItem ${i}/${line}`}
            className={styles.droppedItem}
            style={{
              width: `100px`,
              height: `100px`,
            }}
          >
            {mapComponents(i, line)}
          </div>
        </div>
      );
    }
    return columns;
  };

  const mapLines = () => {
    const lines = [];
    for (let i = 0; i < maxValues!.maxY; i++) {
      lines.push(
        <div
          key={`line-${i}`}
          className={styles.lines}
        >
          {mapColumns(i)}
        </div>
      );
    }
    return lines;
  };

  return (maxValues != null && dropRef != null) ? (
    <div ref={dropRef} className={styles.dropArea} style={containerStyle}>
      {mapLines()}
    </div>
  ) : null;
};




const LandingPages: React.FC = () => {
  const [grids, setGrids] = useState<GridType[]>([
    { id: Date.now(), width: 300, height: 200, divisions: [{ id: 0, x: 0, y: 0, colspaceX: 1, colspaceY: 1, components: [] }] },
  ]);
  const [selectedGrid, setSelectedGrid] = useState<GridType | null>(null);

  const handleDrop = (gridId: number, component: ComponentType, divisionId:number|undefined) => {
    let gridsTemporary = [...grids];
    gridsTemporary.map((grid) =>{
        if(grid.id === gridId){
          let division = grid.divisions.find(e=>e.id === divisionId);
          if(division){
            console.log("TESTE");
            division.components.push(component);
          }
        }
       return grid;
      }
      )
      setGrids(gridsTemporary);
  };

  const addGrid = () => {
    setGrids((prev) => [
      ...prev,
      { id: Date.now(), components: [], width: 300, height: 200, divisions: [{ id: 0, x: 0, y: 0, colspaceX: 1, colspaceY: 1,components: [] }] },
    ]);
  };

  const updateGrid = (gridId: number, width: number, height: number, divisions: divisionType[]) => {
    setGrids((prev) =>
      prev.map((grid) =>
        grid.id === gridId ? { ...grid, width, height, divisions } : grid
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
    if (valueX >= 1 && valueY >= 1) {
      valueX--;
      valueY--;
      let existingMaxValues = getMaxValues(gridId);
      existingMaxValues.maxX--;
      existingMaxValues.maxY--;
      if (selectedGrid?.id === gridId) {

        const updatedDivisions = [...selectedGrid.divisions];

        let diferenceX = valueX - existingMaxValues.maxX;
        let diferenceY = valueY - existingMaxValues.maxY;

        if (diferenceX > 0) {
          for (let i = 0; i < diferenceX; i++) {
            for (let y = 0; y <= existingMaxValues.maxY; y++) {
              updatedDivisions.push({ id: getMaxIdDivision(gridId), x: existingMaxValues.maxX + i + 1, y, colspaceX: 1, colspaceY: 1,components:[] });
            }
          }
        }
        if (diferenceX < 0) {
          let itemsDelete = updatedDivisions.filter(item => item.x + (item.colspaceX - 1) > valueX);
          itemsDelete.forEach((itemDelete) => {
            updatedDivisions.splice(updatedDivisions.indexOf(itemDelete), 1);
          })
        }
        if (diferenceY > 0) {
          for (let i = 0; i < diferenceY; i++) {
            for (let x = 0; x <= existingMaxValues.maxX; x++) {
              updatedDivisions.push({ id: getMaxIdDivision(gridId), x, y: existingMaxValues.maxY + i + 1, colspaceX: 1, colspaceY: 1,components:[] });
            }
          }
        }
        if (diferenceY < 0) {
          let itemsDelete = updatedDivisions.filter(item => item.y + (item.colspaceY - 1) > valueY);
          itemsDelete.forEach((itemDelete) => {
            updatedDivisions.splice(updatedDivisions.indexOf(itemDelete), 1);
          })
        }
        setSelectedGrid((prev) => (prev ? { ...prev, divisions: updatedDivisions } : prev));
        updateGrid(gridId, selectedGrid.width, selectedGrid.height, updatedDivisions);
      }
    }
  };


  const getMaxValues = (gridId: number): { maxX: number, maxY: number } => {
    let maxX = 0;
    let maxY = 0;
    if (selectedGrid?.id === gridId) {
      selectedGrid.divisions.forEach((item) => {
        maxX = Math.max(maxX, item.x + (item.colspaceX - 1));
        maxY = Math.max(maxY, item.y + (item.colspaceY - 1));
      });
    }
    maxX = maxX + 1;
    maxY = maxY + 1;
    return { maxX, maxY }
  }

  const handleSelectGrid = (gridId: number) => {
    setSelectedGrid(grids.find((grid) => grid.id === gridId) || null);
  };

  let getMaxIdDivision = (gridId: number): number => {
    let id = 0;
    selectedGrid?.divisions.forEach((item) => {
      if (item.id > id) {
        id = item.id;
      }
    });
    return id;
  }
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
              <DropArea grid={grid} onDrop={handleDrop} updateGrid={updateGrid} getMaxValues={getMaxValues} />
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
                  onChange={(e) => addNewDivisions(selectedGrid?.id, Number(e.target.value), getMaxValues(selectedGrid?.id).maxY)}
                />
                <input
                  type="number"
                  value={getMaxValues(selectedGrid?.id).maxY}
                  onChange={(e) => addNewDivisions(selectedGrid?.id, getMaxValues(selectedGrid?.id).maxX, Number(e.target.value))}
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
