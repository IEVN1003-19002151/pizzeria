import { Component, OnInit } from '@angular/core';
import { PedidoService, Cliente } from '../pedido.service';
import { FormsModule } from '@angular/forms';
import { CommonModule, CurrencyPipe } from '@angular/common';

interface Venta {
    cliente: string;
    total: number;
    fecha: string;
}

@Component({
  selector: 'app-resumen',
  templateUrl: './resumen.component.html',
  standalone: true,
  imports: [CommonModule, CurrencyPipe, FormsModule]
})
export class ResumenComponent implements OnInit {
  cliente: any;
  pedido: any;
  ventas: any[] = [];
  totalVentas: number = 0;

  constructor(private pedidoService: PedidoService) {
    // Suscribirse a los cambios en las ventas
    this.pedidoService.ventas$.subscribe(ventas => {
      this.ventas = ventas;
    });
  }

  ngOnInit() {
    this.cliente = JSON.parse(localStorage.getItem('cliente') || '{}');
    this.pedido = JSON.parse(localStorage.getItem('pedido') || '{}');
    this.cargarVentas();

    // Suscribirse a las ventas
    this.pedidoService.ventas$.subscribe((ventas: any[]) => {
        this.ventas = ventas;
        this.totalVentas = this.ventas.reduce((acc, venta) => acc + venta.total, 0);
    });

    // Verifica que el cliente tenga un nombre
    if (!this.cliente.nombre) {
        console.warn('El cliente no tiene un nombre definido.');
    }
  }

  ventasTotalesPorDia() {
    console.log('ventasTotalesPorDia');
  }

  mostrarVentas() {
    const ventas = JSON.parse(localStorage.getItem('ventas') || '[]');
    const ventasPorDia: { [key: string]: number } = {};

    ventas.forEach((venta: { fecha: string; total: number }) => {
        if (!ventasPorDia[venta.fecha]) {
            ventasPorDia[venta.fecha] = 0;
        }
        ventasPorDia[venta.fecha] += venta.total;
    });

    // Mostrar las ventas acumuladas
    console.log('Ventas acumuladas por día:', ventasPorDia);
  }

  cargarVentas() {
    this.ventas = JSON.parse(localStorage.getItem('ventas') || '[]');
    this.totalVentas = this.ventas.reduce((acc, venta) => acc + venta.total, 0);
  }

  confirmarPedido() {
    const confirmacion = confirm(`El costo total del pedido es: $${this.totalVentas}. ¿Está de acuerdo?`);
    if (confirmacion) {
      console.log('Pedido confirmado y guardado');
    } else {
      console.log('Permitir edición del pedido');
      // Aquí puedes agregar lógica para permitir la edición del pedido
    }
  }

  guardarDatos(cliente: Cliente, pedido: any) {
    // Elimina los datos existentes antes de guardar nuevos
    localStorage.removeItem('cliente');
    localStorage.removeItem('pedido');

    console.log('Guardando venta:', { cliente: cliente.nombre, total: pedido.total });

    // Asegúrate de que cliente.nombre esté definido
    if (!cliente.nombre) {
        console.error('El cliente no tiene un nombre definido.');
        return; // Salir si no hay nombre
    }

    const ventas: Venta[] = JSON.parse(localStorage.getItem('ventas') || '[]');
    ventas.push({ cliente: cliente.nombre, total: pedido.total, fecha: new Date().toLocaleDateString() });

    // Limitar el número de ventas almacenadas
    if (ventas.length > 10) {
        ventas.shift();
    }

    try {
        localStorage.setItem('ventas', JSON.stringify(ventas));
        localStorage.setItem('cliente', JSON.stringify(cliente));
        localStorage.setItem('pedido', JSON.stringify(pedido));
    } catch (error) {
        console.error('Error al guardar en localStorage:', error);
    }
  }

  reiniciarVentas() {
    localStorage.removeItem('ventas'); // Elimina todas las ventas del almacenamiento local
    this.ventas = []; // Reinicia la lista de ventas en el componente
    this.totalVentas = 0; // Reinicia el total
    console.log('Ventas reiniciadas');
  }

  eliminarVenta(index: number) {
    this.ventas.splice(index, 1); // Elimina la venta del array
    localStorage.setItem('ventas', JSON.stringify(this.ventas)); // Actualiza el almacenamiento local
    this.totalVentas = this.ventas.reduce((acc, venta) => acc + venta.total, 0); // Actualiza el total
    console.log('Venta eliminada');
  }

  getTotalVentas() {
    return this.pedidoService.getTotalVentas();
  }

}

