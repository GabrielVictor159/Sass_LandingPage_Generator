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
    lineHeight?: number | undefined;
  }
