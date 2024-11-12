import { Component, OnInit } from '@angular/core';
import { PedidoService } from '../pedido.service';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ResumenComponent } from '../resumen/resumen.component';
import { Subject } from 'rxjs';
import { Router } from '@angular/router';

interface Pizza {
  id: number;
  tamano: string;
  ingredientes: string[];
  numPizzas: number;
  selected: boolean;
  subtotal: number;
}

@Component({
  selector: 'app-detalle-pedido',
  templateUrl: './detalle-pedido.component.html',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, ResumenComponent]
})
export class DetallePedidoComponent implements OnInit {
  pizzas: Pizza[] = [];
  cliDatos: { pizzas: any[], nombre: string, direccion?: string, telefono?: string } = { pizzas: [], nombre: '' };
  numPizzas: number = 1;
  pizzaEnEdicion: number | null = null;
  pizzaOriginal: any = null;
  private nextPizzaId: number = 1;

  constructor(private pedidoService: PedidoService, private router: Router) {}

  ngOnInit() {
    this.cargarPizzas();
    this.cargarClienteDatos(); 

    this.pedidoService.clienteDatosObservable.subscribe(datos => {
      this.cliDatos = datos;
      this.pizzas = datos.pizzas;
    });

    this.pedidoService.pizzas$.subscribe(pizzas => {
      this.pizzas = pizzas;
      this.cargarClienteDatos();
    });
  }

  cargarPizzas() {
    const pizzasGuardadas = localStorage.getItem('pizzas');
    this.pizzas = pizzasGuardadas ? JSON.parse(pizzasGuardadas) : this.pedidoService.obtenerPizzas();
  }

  cargarClienteDatos() {
    const datosGuardados = localStorage.getItem('clienteDatos');
    this.cliDatos = datosGuardados ? JSON.parse(datosGuardados) : this.pedidoService.obtenerClienteDatos();
  }

  guardarClienteDatos() {
    localStorage.setItem('clienteDatos', JSON.stringify(this.cliDatos));
  }

  guardarPizzas() {
    localStorage.setItem('pizzas', JSON.stringify(this.pizzas));
  }

  calculateSubtotal(pizza: any): number {
    let subtotal = 0;
    const precios: { [key: string]: number } = { 'Chica': 40, 'Mediana': 80, 'Grande': 120 };
    subtotal += precios[pizza.tamano as keyof typeof precios] || 0;
    subtotal += (pizza.ingredientes?.length || 0) * 10;
    subtotal *= pizza.numPizzas;
    return subtotal;
  }

  terminarPedido() {
    const pizzasSeleccionadas = this.pizzas.filter(pizza => pizza.selected);
    const total = pizzasSeleccionadas.reduce((acc, pizza) => acc + this.calculateSubtotal(pizza), 0);
    
    if (total > 0) {
      const confirmacion = confirm(`El total de su pedido es: $${total.toFixed(2)}. ¿Desea confirmar la compra?`);
      if (confirmacion) {
        this.pedidoService.actualizarVentaCliente(this.cliDatos.nombre, total);
        alert("¡Pedido confirmado y guardado!");
        this.pedidoService.limpiarPedidoEnEdicion();
        this.pizzas.forEach(pizza => pizza.selected = false);
        this.guardarPizzas();
      } else {
        this.manejarEdicionPedido(pizzasSeleccionadas, total);
      }
    } else {
      alert("No hay pizzas seleccionadas para el pedido.");
    }
  }

  private manejarEdicionPedido(pizzasSeleccionadas: any[], total: number) {
    const quiereEditar = confirm("¿Desea editar su compra?");
    if (quiereEditar) {
      const pedidoParaEditar = {
        pizzas: pizzasSeleccionadas,
        cliente: this.cliDatos.nombre,
        direccion: this.cliDatos.direccion,
        telefono: this.cliDatos.telefono,
        total
      };
      this.pedidoService.guardarPedidoEnEdicion(pedidoParaEditar);
      this.router.navigate(['/cliente'], { 
        state: { 
          editMode: true,
          pedidoEnEdicion: true,
          clienteDatos: pedidoParaEditar
        }
      });
    }
  }

  actualizarPedido(pedidoActualizado: any) {
    this.cliDatos = pedidoActualizado;
    this.pizzas = pedidoActualizado.pizzas;
    this.guardarClienteDatos();
    this.guardarPizzas();
    this.pedidoService.actualizarPizzas(this.pizzas);
  }

  editarPedido(index: number) {
    const pizzaSeleccionada = this.pizzas[index];
    const pedidoParaEditar = {
      id: index + 1,
      pizzas: [pizzaSeleccionada],
      cliente: this.cliDatos.nombre,
      direccion: this.cliDatos.direccion,
      telefono: this.cliDatos.telefono,
      total: this.calculateSubtotal(pizzaSeleccionada)
    };
    
    this.pedidoService.guardarPedidoEnEdicion(pedidoParaEditar);
    this.router.navigate(['/cliente'], { 
      state: { 
        editMode: true,
        pedidoEnEdicion: true,
        pedidoId: index + 1,
        clienteDatos: pedidoParaEditar
      }
    });
  }

  iniciarEdicion(index: number) {
    this.pizzaEnEdicion = index;
    this.pizzaOriginal = JSON.parse(JSON.stringify(this.pizzas[index]));
    if (!Array.isArray(this.pizzas[index].ingredientes)) {
      this.pizzas[index].ingredientes = [];
    }
  }

  guardarEdicion(index: number) {
    const pizzaEditada = this.pizzas[index];
    if (!Array.isArray(pizzaEditada.ingredientes)) {
      pizzaEditada.ingredientes = [];
    }
    pizzaEditada.subtotal = this.calculateSubtotal(pizzaEditada);
    this.pedidoService.actualizarPizza(index, pizzaEditada);
    this.pizzaEnEdicion = null;
    this.pizzaOriginal = null;
    this.guardarPizzas();
  }

  cancelarEdicion() {
    if (this.pizzaEnEdicion !== null && this.pizzaOriginal) {
      this.pizzas[this.pizzaEnEdicion] = { ...this.pizzaOriginal };
    }
    this.pizzaEnEdicion = null;
    this.pizzaOriginal = null;
  }

  seleccionarPizza(index: number) {
    if (this.pizzaEnEdicion === null) {
      this.pizzas[index].selected = !this.pizzas[index].selected;
      this.guardarPizzas();
    }
  }

  quitarPizzasSeleccionadas() {
    this.pizzas = this.pizzas.filter(pizza => !pizza.selected);
    this.guardarPizzas();
  }

  toggleIngrediente(index: number, ingrediente: string) {
    const pizza = this.pizzas[index];
    if (pizza.ingredientes.includes(ingrediente)) {
        pizza.ingredientes = pizza.ingredientes.filter(i => i !== ingrediente);
    } else {
        pizza.ingredientes.push(ingrediente);
    }
  }
}