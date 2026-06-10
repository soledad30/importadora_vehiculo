export type RootStackParamList = {
  Login: undefined;
  Catalog: undefined;
  Pedidos: undefined;
  PedidoDetail: { pedidoId: number };
  Inspeccion: { pedidoId: number };
};
