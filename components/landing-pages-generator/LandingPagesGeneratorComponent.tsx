import React, { useState, useRef, useEffect } from "react";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import styles from "./LadingPagesGeneratorStyles.module.css";
import DraggableComponent from "./DraggableComponent";
import DropAreaComponent from "./DropAreaComponent";

const LandingPagesGeneratorComponent: React.FC = () => {
    const [grids, setGrids] = useState<GridType[]>([
      { id: Date.now(), width: 300, height: 200, divisions: [{ id: 0, x: 0, y: 0, colspaceX: 1, colspaceY: 1, components: [] }] },
    ]);
    const [selectedGridId, setSelectedGridId] = useState<number | null>(null);
  
  
    const handleDrop = (gridId: number, component: ComponentType, divisionId: number | undefined) => {
      let gridsTemporary = [...grids];
      gridsTemporary.map((grid) => {
        if (grid.id === gridId) {
          let division = grid.divisions.find(e => e.id === divisionId);
          if (division) {
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
        { id: Date.now(), components: [], width: 300, height: 200, divisions: [{ id: 0, x: 0, y: 0, colspaceX: 1, colspaceY: 1, components: [], domRect: undefined }] },
      ]);
    };
  
  
    const updateGrid = (gridId: number, width: number, height: number, divisions: divisionType[],updateSelect:boolean = false) => {
      setGrids((prev) =>
        prev.map((grid) => {
          if (grid.id === gridId) {
            setSelectedGridId(gridId);
            return { ...grid, width, height, divisions };
          }
      
          return grid;
        })
      );
      
  
    };
    
    const getSelectedGrid = () => {
      return grids.find((grid) => grid.id === selectedGridId)!;
    };
  
    const handleGridSizeChange = (gridId: number, width: number, height: number) => {
      setGrids((prev) =>
        prev.map((grid) => (grid.id === gridId ? { ...grid, width, height } : grid))
      );
    };
  
    const addNewDivisions = (gridId: number, valueX: number, valueY: number) => {
      if (valueX >= 1 && valueY >= 1) {
        valueX--;
        valueY--;
        let existingMaxValues = getMaxValues(gridId);
        existingMaxValues.maxX--;
        existingMaxValues.maxY--;
        let maxId = getMaxIdDivision(gridId);
        if (selectedGridId === gridId) {
  
          const updatedDivisions = [...getSelectedGrid().divisions];
  
          let diferenceX = valueX - existingMaxValues.maxX;
          let diferenceY = valueY - existingMaxValues.maxY;
  
  
          if (diferenceX > 0) {
            for (let i = 0; i < diferenceX; i++) {
              for (let y = 0; y <= existingMaxValues.maxY; y++) {
                updatedDivisions.push({ id: maxId + 1, x: existingMaxValues.maxX + i + 1, y, colspaceX: 1, colspaceY: 1, components: [] });
                maxId++;
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
                updatedDivisions.push({ id: maxId + 1, x, y: existingMaxValues.maxY + i + 1, colspaceX: 1, colspaceY: 1, components: [] });
                maxId++;
              }
            }
          }
          if (diferenceY < 0) {
            let itemsDelete = updatedDivisions.filter(item => item.y + (item.colspaceY - 1) > valueY);
            itemsDelete.forEach((itemDelete) => {
              updatedDivisions.splice(updatedDivisions.indexOf(itemDelete), 1);
            })
          }
          updateGrid(gridId, getSelectedGrid().width, getSelectedGrid().height, updatedDivisions);
        }
      }
    };
  
  
    const getMaxValues = (gridId: number): { maxX: number, maxY: number } => {
      let maxX = 0;
      let maxY = 0;
      if (selectedGridId === gridId) {
        getSelectedGrid().divisions.forEach((item) => {
          maxX = Math.max(maxX, item.x + (item.colspaceX - 1));
          maxY = Math.max(maxY, item.y + (item.colspaceY - 1));
        });
      }
      maxX = maxX + 1;
      maxY = maxY + 1;
      return { maxX, maxY }
    }
  
    let getMaxIdDivision = (gridId: number): number => {
      let id = 0;
      getSelectedGrid()?.divisions.forEach((item) => {
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
              <div key={grid.id} className={styles.gridItem} onClick={() => setSelectedGridId(grid.id)}>
                <DropAreaComponent grid={grid} onDrop={handleDrop} updateGrid={updateGrid} getMaxValues={getMaxValues} />
              </div>
            ))}
            <button onClick={addGrid}>Adicionar Grid</button>
          </div>
          <div>
            <h3>Editar Componente</h3>
            {selectedGridId && (
              <div className={styles.gridControls}>
                <label className={styles.label}>
                  Largura:
                  <input
                    type="number"
                    value={getSelectedGrid().width}
                    onChange={(e) => handleGridSizeChange(getSelectedGrid().id, parseInt(e.target.value), getSelectedGrid().height)}
                  />
                </label >
                <label className={styles.label}>
                  Altura:
                  <input
                    type="number"
                    value={getSelectedGrid().height}
                    onChange={(e) => handleGridSizeChange(getSelectedGrid().id, getSelectedGrid().width, parseInt(e.target.value))}
                  />
                </label>
                <label className={styles.label}>
                  Divisões:
                  <input
                    type="number"
                    value={getMaxValues(getSelectedGrid()?.id).maxX}
                    onChange={(e) => addNewDivisions(getSelectedGrid()?.id, Number(e.target.value), getMaxValues(getSelectedGrid()?.id).maxY)}
                  />
                  <input
                    type="number"
                    value={getMaxValues(getSelectedGrid()?.id).maxY}
                    onChange={(e) => addNewDivisions(getSelectedGrid()?.id, getMaxValues(getSelectedGrid()?.id).maxX, Number(e.target.value))}
                  />
  
                </label>
              </div>
            )}
          </div>
        </div>
      </DndProvider>
    );
  };
  
  export default LandingPagesGeneratorComponent;