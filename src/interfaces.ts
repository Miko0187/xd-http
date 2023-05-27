export interface IRouteMap {
  [key: string]: {
    GET?: () => void;
    POST?: () => void;
    PUT?: () => void;
    DELETE?: () => void;
    PATCH?: () => void;
  };
}
