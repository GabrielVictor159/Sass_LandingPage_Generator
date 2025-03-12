import React, { useState, useRef, useEffect } from "react";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import styles from "./LadingPagesGeneratorStyles.module.css";

const DropAreaComponent: React.FC<{
    grid: GridType;
    onDrop: (gridId: number, item: ComponentType, divisionId: number | undefined) => void;
    updateGrid: (gridId: number, width: number, height: number, divisions: divisionType[], updateSelect?: boolean) => void;
    getMaxValues: (gridId: number) => { maxX: number; maxY: number };
}> = ({ grid, onDrop, updateGrid, getMaxValues }) => {
    const dropRef = useRef<HTMLDivElement | null>(null);
    const [maxValues, setMaxValues] = useState<{ maxX: number; maxY: number }>();
    const [lineHeights, setLineHeights] = useState<number[]>([]);

    useEffect(() => {
        let maxValues = getMaxValues(grid.id);
        setMaxValues(maxValues);
        setLineHeights((prevLineHeights) => {
            const updatedLineHeights = [...prevLineHeights];

            for (let i = 0; i < maxValues.maxY; i++) {
                if (updatedLineHeights[i] === undefined) {
                    updatedLineHeights[i] = commonProperties.defaultHeightComponent;
                }
            }

            return updatedLineHeights;
        });
    }, [grid]);


    // useEffect(()=>{
    //     let updateDivisions = [...grid.divisions];
    //     updateDivisions = updateDivisions.map(e=>{
    //         let lineHeight = lineHeights[e.y];
    //         if(lineHeight){
    //             e.lineHeight = lineHeight;
    //         }
    //         return e});
        
    //     updateGrid(grid.id, grid.width, grid.height, updateDivisions);
    // },[lineHeights]);

    useEffect(()=>{
        let maxValues = getMaxValues(grid.id);
        setLineHeights([]);
        let temporaryLineHeights:number[] = [];
        for (let i = 0; i < maxValues.maxY; i++) {
            let divisionExistingHeight = grid.divisions.find(e=>e.y === i && e.lineHeight);
            if(!divisionExistingHeight){
                temporaryLineHeights.push(commonProperties.defaultHeightComponent);
            }
            else{
                temporaryLineHeights.push(divisionExistingHeight.lineHeight!);
            }
        }
        setLineHeights(temporaryLineHeights);
    },[]);

    const [, drop] = useDrop({
        accept: "component",
        drop: (item: { type: string }, monitor) => {
            if (dropRef.current) {
                const { x: clientX, y: clientY } = monitor.getClientOffset() || { x: 0, y: 0 };

                const closestDivision = divisionDomRects.reduce<{ id: number; distance: number } | null>((closest, div) => {
                    const { dom } = div;
                    const centerX = dom.left + dom.width / 2;
                    const centerY = dom.top + dom.height / 2;

                    const distance = Math.sqrt((centerX - clientX) ** 2 + (centerY - clientY) ** 2);
                    if (!closest || distance < closest.distance) {
                        return { id: div.id, distance };
                    }

                    return closest;
                }, null);

                if (closestDivision) {
                    onDrop(grid.id, {
                        id: Date.now(),
                        type: item.type as ComponentType["type"],
                        content: item.type === "title" ? "Título Editável" : item.type === "button" ? "Clique Aqui" : "",
                    }, closestDivision.id);
                }
            }
        },
    });

    useEffect(() => {
        if (dropRef.current && maxValues) {
            drop(dropRef.current);
        }
    }, [drop, maxValues]);

    const divisionRefs = useRef<Map<number, React.RefObject<HTMLDivElement | null>>>(new Map());
    const [divisionDomRects, setDivisionDomRects] = useState<{ id: number; dom: DOMRect }[]>([]);

    useEffect(() => {
        setTimeout(() => {
            setDivisionDomRects([]);

            requestAnimationFrame(() => {
                const newDomRects = grid.divisions
                    .map((division) => {
                        const ref = divisionRefs.current.get(division.id);

                        if (ref?.current) {
                            return { id: division.id, dom: ref.current.getBoundingClientRect() };
                        }
                        return null;
                    })
                    .filter((item): item is { id: number; dom: DOMRect } => item !== null);
                setDivisionDomRects(newDomRects);
            });
        }, 100);
    }, [grid]);

    const handleContentChange = (id: number, newContent: string) => {
        updateGrid(grid.id, grid.width, grid.height, grid.divisions);
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
            const division = grid.divisions.find((div) => div.x === i && div.y === line);
            if (!division) continue;

            let divisionRef = divisionRefs.current.get(division.id);
            if (!divisionRef) {
                divisionRef = React.createRef<HTMLDivElement>();
                divisionRefs.current.set(division.id, divisionRef);
            }

            let addSpaceGapX = commonProperties.gapColumns * (division.colspaceX - 1);
            columns.push(
                <div key={`column-${line}-${i}`} className={styles.columns} style={{ gap: `${commonProperties.gapColumns}rem` }}>
                    <div
                        key={`dropedItem ${i}/${line}`}
                        className={styles.droppedItem}
                        style={{ width: `${(commonProperties.defaultWidthComponent * division.colspaceX) + addSpaceGapX}rem`, height: `${lineHeights[line] ?? 0}rem` }}
                        ref={divisionRef}
                    >
                        <button onClick={() => { expandColspace(division.id,'x') }}>{"Expandir →"}</button>
                        {mapComponents(i, line)}
                    </div>
                </div>
            );
        }

        return columns;
    };

    const handleResizeMouseDown = (e: React.MouseEvent, line: number) => {
        e.preventDefault();

        const startY = e.clientY;
        const initialHeight = lineHeights[line];
        if (initialHeight === undefined) return;

        const handleMouseMove = (moveEvent: MouseEvent) => {
            const deltaY = moveEvent.clientY - startY;
            const newHeight = Math.max(initialHeight + deltaY / 10, 1);

            setLineHeights((prevLineHeights) => {
                const updatedLineHeights = [...prevLineHeights];
                updatedLineHeights[line] = newHeight;
                return updatedLineHeights;
            });

            let updateDivisions = [...grid.divisions];
            updateDivisions = updateDivisions.map(e=>{
                let lineHeight = lineHeights[e.y];
                if(lineHeight){
                    e.lineHeight = lineHeight;
                }
                return e});
            
            updateGrid(grid.id, grid.width, grid.height, updateDivisions);

        };

        const handleMouseUp = () => {
            window.removeEventListener("mousemove", handleMouseMove);
            window.removeEventListener("mouseup", handleMouseUp);
        };

        window.addEventListener("mousemove", handleMouseMove);
        window.addEventListener("mouseup", handleMouseUp);
    };

    const mapLines = () => {
        const lines = [];
        for (let i = 0; i < maxValues!.maxY; i++) {
            lines.push(
                <div
                    key={`line-${i}`}
                    style={{ display: "flex", flexDirection: "column" }}
                >
                    <div
                        style={{ gap: `${commonProperties.gapLines}rem` }}
                        className={styles.lines}
                    >
                        {mapColumns(i)}
                    </div>
                    <div
                        className={styles.resizeHandle}
                        onMouseDown={(e) => handleResizeMouseDown(e, i)}
                    ><p>▾</p></div>
                </div>
            );
        }
        return lines;
    };

    const expandColspace = (divisionId: number, axis: 'x' | 'y') => {
        const updatedDivisions: divisionType[] = [...grid.divisions];
        let indexDivision = updatedDivisions.findIndex((div) => div.id === divisionId);
      
        if (indexDivision !== -1) {
          const axisColspace = axis === 'x' ? 'colspaceX' : 'colspaceY';
      
          let proximity = updatedDivisions.find(
            (e) => e[axis] > updatedDivisions[indexDivision][axis] && e[axis === 'x' ? 'y' : 'x'] === updatedDivisions[indexDivision][axis === 'x' ? 'y' : 'x']
          );
      
          if (proximity) {
            let newValueAddColspace = proximity !== undefined ? proximity[axisColspace] : 1;
            updatedDivisions[indexDivision][axisColspace] += newValueAddColspace;
      
            let indexRemove = updatedDivisions.findIndex((d) => d.id === proximity.id);
            if (indexRemove !== -1) {
              updatedDivisions.splice(indexRemove, 1);
            }
          }
      
          updateGrid(grid.id, grid.width, grid.height, updatedDivisions, true);
        }
      };

    const commonProperties = {
        gapLines: 1,
        gapColumns: 1,
        defaultWidthComponent: 10,
        defaultHeightComponent: 10,
    };

    const containerStyle: React.CSSProperties = {
        width: `${grid.width}px`,
        height: `${grid.height}px`,
        gap: `${commonProperties.gapLines}rem`,
        position: "relative",
        border: "1px solid #ccc",
    };

    return maxValues != null && dropRef != null ? (
        <div ref={dropRef} className={styles.dropArea} style={containerStyle}>
            {mapLines()}

        </div>
    ) : null;
};

export default DropAreaComponent;
