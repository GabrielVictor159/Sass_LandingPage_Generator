import React, { useState, useRef } from "react";
import { DndProvider, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import styles from "./LadingPagesGeneratorStyles.module.css";
import DraggableComponent from "./DraggableComponent";
import DraggableContainer from "./DraggableContainer";

const LandingPagesGeneratorComponent: React.FC = () => {
  const [grids, setGrids] = useState<GridType[]>([
    { id: Date.now(), components: [] },
  ]);

  const addGrid = () => {
    setGrids((prev) => [...prev, { id: Date.now(), components: [] }]);
  };

  const addChildToContainer = (
    components: ComponentType[],
    parentId: number,
    child: ComponentType
  ): ComponentType[] => {
    return components.map((component) => {
      if (component.id === parentId) {
        return {
          ...component,
          children: [...(component.children || []), child],
        };
      } else if (component.type === "container" && component.children) {
        return {
          ...component,
          children: addChildToContainer(component.children, parentId, child),
        };
      }
      return component;
    });
  };

  const moveChildInContainer = (
    components: ComponentType[],
    parentId: number,
    childId: number,
    left: number,
    top: number
  ): ComponentType[] => {
    return components.map((component) => {
      if (component.id === childId) {
        return { ...component, left, top };
      }

      if (component.type === "container" && component.children) {
        return {
          ...component,
          children: moveChildInContainer(component.children, parentId, childId, left, top),
        };
      }

      return component;
    });
  };


  const resizeChildInContainer = (
    components: ComponentType[],
    parentId: number,
    childId: number,
    width: number,
    height: number
  ): ComponentType[] => {
    return components.map((component) => {
      if (component.id === parentId) {
        return {
          ...component,
          children: (component.children || []).map((child) =>
            child.id === childId ? { ...child, width, height } : child
          ),
        };
      } else if (component.type === "container" && component.children) {
        return {
          ...component,
          children: resizeChildInContainer(component.children, parentId, childId, width, height),
        };
      }
      return component;
    });
  };

  const handleDropComponent = (gridId: number, component: ComponentType) => {
    setGrids((prevGrids) =>
      prevGrids.map((grid) =>
        grid.id === gridId
          ? {
            ...grid,
            components: [...grid.components, component],
          }
          : grid
      )
    );
  };

  const handleMoveComponent = (
    gridId: number,
    compId: number,
    left: number,
    top: number
  ) => {
    setGrids((prevGrids) =>
      prevGrids.map((grid) =>
        grid.id === gridId
          ? {
            ...grid,
            components: moveChildInContainer(
              grid.components,
              grid.id,
              compId,
              left,
              top
            ),
          }
          : grid
      )
    );
  };


  const handleResizeComponent = (
    gridId: number,
    compId: number,
    width: number,
    height: number
  ) => {
    setGrids((prevGrids) =>
      prevGrids.map((grid) =>
        grid.id === gridId
          ? {
            ...grid,
            components: grid.components.map((comp) =>
              comp.id === compId ? { ...comp, width, height } : comp
            ),
          }
          : grid
      )
    );
  };

  const DropArea: React.FC<{
    grid: GridType;
    onDropComponent: (gridId: number, component: ComponentType) => void;
    onMoveComponent: (gridId: number, compId: number, left: number, top: number) => void;
    onDropChild: (parentId: number, child: ComponentType) => void;
    onMoveChild: (parentId: number, childId: number, left: number, top: number) => void;
  }> = ({ grid, onDropComponent, onMoveComponent, onDropChild, onMoveChild }) => {
    const ref = useRef<HTMLDivElement>(null);

    const [, drop] = useDrop({
      accept: "component",
      drop: (item: { type: string; id?: number }, monitor) => {
        const offset = monitor.getClientOffset();
        const relativeArea = ref.current?.querySelector(`.${styles.innerRelativeArea}`) as HTMLDivElement;
        const boundingRect = relativeArea?.getBoundingClientRect();

        console.log("boundingRect", boundingRect);
        console.log("offset", offset);
        console.log("TEST");
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
            ? onMoveComponent(grid.id, item.id, newLeft, newTop)
            : onDropComponent(grid.id, newComponent);
        }
      },
    });

    drop(ref);

    return (
      <div ref={ref} className={styles.gridItem}>
        <div className={styles.innerRelativeArea}>
          {grid.components.map((comp) => (
            <div
              key={comp.id}
              style={{
                position: "absolute",
                left: comp.left,
                top: comp.top,
              }}
            >
              {comp.type === "container" ? (
                <DraggableContainer
                  id={comp.id}
                  type={comp.type}
                  left={comp.left}
                  top={comp.top}
                  width={comp.width}
                  height={comp.height}
                  childrenComponents={comp.children || []}
                  onDropChild={(parentId, child) => {
                    setGrids((prev) =>
                      prev.map((g) =>
                        g.id === grid.id
                          ? {
                            ...g,
                            components: addChildToContainer(g.components, parentId, child),
                          }
                          : g
                      )
                    );
                  }}
                  onMoveChild={(parentId, childId, left, top) => {
                    setGrids((prev) =>
                      prev.map((g) =>
                        g.id === grid.id
                          ? {
                            ...g,
                            components: moveChildInContainer(
                              g.components,
                              parentId,
                              childId,
                              left,
                              top
                            ),
                          }
                          : g
                      )
                    );
                  }}

                  onResize={(containerId, width, height, parentId) => {
                    if (parentId) {
                      setGrids((prev) =>
                        prev.map((g) =>
                          g.id === grid.id
                            ? {
                              ...g,
                              components: resizeChildInContainer(
                                g.components,
                                parentId,
                                containerId,
                                width,
                                height
                              ),
                            }
                            : g
                        )
                      );
                    } else {
                      handleResizeComponent(grid.id, containerId, width, height);
                    }
                  }}
                />
              ) : (
                <DraggableComponent type={comp.type} id={comp.id} />
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className={styles.container}>
        <div className={styles.gridArea}>
          {grids.map((grid) => (
            <DropArea
              key={grid.id}
              grid={grid}
              onDropComponent={handleDropComponent}
              onMoveComponent={handleMoveComponent}
              onDropChild={(parentId, child) => {
                setGrids((prev) =>
                  prev.map((g) =>
                    g.id === grid.id
                      ? {
                        ...g,
                        components: addChildToContainer(g.components, parentId, child),
                      }
                      : g
                  )
                );
              }}
              onMoveChild={(parentId, childId, left, top) => {
                setGrids((prev) =>
                  prev.map((g) =>
                    g.id === grid.id
                      ? {
                        ...g,
                        components: moveChildInContainer(
                          g.components,
                          parentId,
                          childId,
                          left,
                          top
                        ),
                      }
                      : g
                  )
                );
              }}
            />

          ))}
          <button onClick={addGrid}>Adicionar Grid</button>
        </div>
        <div className={styles.boxEditor}>
          <div className={styles.items}>
            <DraggableComponent type="title" />
            <DraggableComponent type="image" />
            <DraggableComponent type="button" />
            <DraggableComponent type="container" />
          </div>
        </div>
      </div>
    </DndProvider>
  );
};

export default LandingPagesGeneratorComponent;
