export type ResourceKind = {
  image: string;
  name: string;
  label: string;
  amount: number;
};
export type ResourceKindMap = { [k: string]: ResourceKind };
