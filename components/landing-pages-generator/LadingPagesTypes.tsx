type ComponentType = {
  id: number;
  type: "title" | "image" | "button" | "container";
  left: number;
  top: number;
  width?: number;
  height?: number;
  children?: ComponentType[];
};



  interface GridType {
    id: number;
    components: ComponentType[];
  }

  