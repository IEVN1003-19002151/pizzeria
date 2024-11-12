import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';

export interface Cliente {
  nombre: string;
  direccion: string;
  telefono: string;
  pizzas: any[];
}

interface Pizza {
  tamano: string;
  ingredientes: string[];
  numPizzas: number;
  subtotal: number;
}

@Injectable({
  providedIn: 'root',
})
export class PedidoService {
  private pizzasSubject = new BehaviorSubject<any[]>(this.obtenerPizzas());
  pizzas$ = this.pizzasSubject.asObservable();

  private clienteDatosSubject = new Subject<any>();
  clienteDatosObservable = this.clienteDatosSubject.asObservable();

  private ventasSubject = new BehaviorSubject<any[]>(JSON.parse(localStorage.getItem('ventas') || '[]'));
  ventas$ = this.ventasSubject.asObservable();

  private clienteDatos: Cliente = this.obtenerClienteDatos();
  private ventas: any[] = [];
  private totalVentas: number = 0;
  private pedidoTemporal = new BehaviorSubject<any>(null);
  pedidoTemporal$ = this.pedidoTemporal.asObservable();
  private pedidoEnEdicionSubject = new BehaviorSubject<any>(null);
  pedidoEnEdicion$ = this.pedidoEnEdicionSubject.asObservable();

  guardarDatos(cliente: Cliente, pedido: any) {
    localStorage.setItem('cliente', JSON.stringify(cliente));
    localStorage.setItem('pedido', JSON.stringify(pedido));
  }

  guardarClienteDatos(cliente: Cliente) {
    localStorage.setItem('nombre', cliente.nombre);
    localStorage.setItem('direccion', cliente.direccion);
    localStorage.setItem('telefono', cliente.telefono);
    localStorage.setItem('pizzas', JSON.stringify(cliente.pizzas));
  }

  obtenerDatos() {
    return {
      cliente: JSON.parse(localStorage.getItem('cliente') || '{}'),
      pedido: JSON.parse(localStorage.getItem('pedido') || '{}'),
    };
  }

  obtenerClienteDatos(): Cliente {
    return {
      nombre: localStorage.getItem('nombre') || '',
      direccion: localStorage.getItem('direccion') || '',
      telefono: localStorage.getItem('telefono') || '',
      pizzas: this.obtenerPizzas(),
    };
  }

  eliminarDatos() {
    localStorage.removeItem('cliente');
    localStorage.removeItem('pedido');
    localStorage.removeItem('nombre');
    localStorage.removeItem('direccion');
    localStorage.removeItem('telefono');
    localStorage.removeItem('fecha');
    localStorage.removeItem('pizzas');
    this.pizzasSubject.next([]);
  }

  agregarPizza(pizza: Pizza) {
    const pizzas = this.obtenerPizzas();
    pizzas.push(pizza);
    this.actualizarPizzas(pizzas);
  }

  eliminarPizza(index: number) {
    const pizzas = this.obtenerPizzas();
    if (index > -1 && index < pizzas.length) {
      pizzas.splice(index, 1);
      this.actualizarPizzas(pizzas);
    }
  }

  obtenerPizzas(): any[] {
    return JSON.parse(localStorage.getItem('pizzas') || '[]');
  }

  actualizarPizzas(pizzas: any[]) {
    localStorage.setItem('pizzas', JSON.stringify(pizzas));
    this.pizzasSubject.next(pizzas);
  }

  actualizarDetalles(clienteActual: any) {
    this.clienteDatos = clienteActual;
    this.clienteDatosSubject.next(this.clienteDatos);
  }

  quitarPizza(pizza: any) {
    const pizzas = this.obtenerPizzas();
    const index = pizzas.findIndex(p => 
      p.tamano === pizza.tamano && 
      JSON.stringify(p.ingredientes) === JSON.stringify(pizza.ingredientes)
    );
    if (index > -1) {
      pizzas.splice(index, 1);
      this.actualizarPizzas(pizzas);
    }
  }

  agregarVenta(cliente: string, total: number, fecha: string) {
    const ventas = this.ventasSubject.getValue();
    const ventaExistente = ventas.find(v => v.cliente === cliente);
    
    if (ventaExistente) {
      ventaExistente.total = total;
      ventaExistente.fecha = fecha;
    } else {
      ventas.push({ cliente, total, fecha });
    }

    try {
      localStorage.setItem('ventas', JSON.stringify(ventas));
    } catch (error) {
      console.error('Error al guardar en localStorage:', error);
    }
    this.ventasSubject.next(ventas);
  }

  obtenerVentas() {
    return JSON.parse(localStorage.getItem('ventas') || '[]');
  }

  cargarVentas() {
    this.ventas = JSON.parse(localStorage.getItem('ventas') || '[]');
    this.totalVentas = this.ventas.reduce((acc, venta) => acc + venta.total, 0);
  }

  getVentas() {
    return this.ventasSubject.getValue();
  }

  getTotalVentas() {
    return this.totalVentas;
  }

  actualizarPizza(index: number, pizzaActualizada: Pizza) {
    const pizzas = this.obtenerPizzas();
    if (index > -1 && index < pizzas.length) {
      pizzas[index] = pizzaActualizada;
      this.actualizarPizzas(pizzas);
    }
  }

  guardarPedidoTemporal(pedido: any) {
    this.pedidoTemporal.next(pedido);
  }

  obtenerPedidoTemporal() {
    return this.pedidoTemporal.getValue();
  }

  limpiarPedidoTemporal() {
    this.pedidoTemporal.next(null);
  }

  actualizarClienteDatos(clienteDatos: any) {
    localStorage.setItem('clienteDatos', JSON.stringify(clienteDatos));
  }

  guardarPedidoEnEdicion(pedido: any) {
    if (!pedido.id) {
      pedido.id = Date.now();
    }
    this.pedidoEnEdicionSubject.next(pedido);
    localStorage.setItem('pedidoEnEdicion', JSON.stringify(pedido));
    return pedido.id;
  }

  obtenerPedidoEnEdicion() {
    const pedidoGuardado = localStorage.getItem('pedidoEnEdicion');
    return pedidoGuardado ? JSON.parse(pedidoGuardado) : null;
  }

  limpiarPedidoEnEdicion() {
    this.pedidoEnEdicionSubject.next(null);
    localStorage.removeItem('pedidoEnEdicion');
  }

  obtenerPedidoPorId(id: number) {
    const pizzas = this.obtenerPizzas();
    const pedido = pizzas.find(p => p.id === id);
    if (pedido) {
      const clienteDatos = this.obtenerClienteDatos();
      return {
        ...pedido,
        cliente: clienteDatos.nombre,
        direccion: clienteDatos.direccion,
        telefono: clienteDatos.telefono
      };
    }
    return null;
  }

  actualizarVentaCliente(cliente: string, nuevoTotal: number) {
    const ventas = this.getVentas();
    const fecha = new Date().toLocaleDateString();
    const ventaExistente = ventas.find(v => v.cliente === cliente);
    
    if (ventaExistente) {
      ventaExistente.total = nuevoTotal;
      ventaExistente.fecha = fecha;
    } else {
      ventas.push({
        cliente,
        total: nuevoTotal,
        fecha
      });
    }
    
    localStorage.setItem('ventas', JSON.stringify(ventas));
    this.ventasSubject.next(ventas);
  }
} 