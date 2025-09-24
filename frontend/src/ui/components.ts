// UI Components library
export class Toast {
    private static container: HTMLElement | null = null;
    
    private static getContainer(): HTMLElement {
        if (!this.container) {
            this.container = document.getElementById('toast-container');
            if (!this.container) {
                this.container = document.createElement('div');
                this.container.id = 'toast-container';
                this.container.className = 'toast-container';
                document.body.appendChild(this.container);
            }
        }
        return this.container;
    }
    
    static show(type: 'success' | 'error' | 'warning' | 'info', title: string, message: string = '', duration: number = 5000) {
        const container = this.getContainer();
        
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        
        const titleEl = document.createElement('div');
        titleEl.className = 'toast-title';
        titleEl.textContent = title;
        
        const messageEl = document.createElement('div');
        messageEl.className = 'toast-message';
        messageEl.textContent = message;
        
        toast.appendChild(titleEl);
        if (message) toast.appendChild(messageEl);
        
        container.appendChild(toast);
        
        // Show toast
        setTimeout(() => toast.classList.add('show'), 100);
        
        // Auto remove
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        }, duration);
    }
    
    static success(title: string, message: string = '') {
        this.show('success', title, message);
    }
    
    static error(title: string, message: string = '') {
        this.show('error', title, message);
    }
    
    static warning(title: string, message: string = '') {
        this.show('warning', title, message);
    }
    
    static info(title: string, message: string = '') {
        this.show('info', title, message);
    }
}

export class Modal {
    private static container: HTMLElement | null = null;
    
    private static getContainer(): HTMLElement {
        if (!this.container) {
            this.container = document.getElementById('modal-container');
            if (!this.container) {
                this.container = document.createElement('div');
                this.container.id = 'modal-container';
                this.container.className = 'modal-container';
                document.body.appendChild(this.container);
            }
        }
        return this.container;
    }
    
    static show(title: string, content: string, options: {
        onConfirm?: () => void;
        onCancel?: () => void;
        confirmText?: string;
        cancelText?: string;
        size?: 'sm' | 'md' | 'lg';
        showCancel?: boolean;
    } = {}): HTMLElement {
        const container = this.getContainer();
        
        const {
            onConfirm,
            onCancel,
            confirmText = 'Confirmar',
            cancelText = 'Cancelar',
            size = 'md',
            showCancel = true
        } = options;
        
        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay';
        
        const modal = document.createElement('div');
        modal.className = `modal modal-${size}`;
        
        const header = document.createElement('div');
        header.className = 'modal-header';
        
        const titleEl = document.createElement('h3');
        titleEl.className = 'modal-title';
        titleEl.textContent = title;
        
        const closeBtn = document.createElement('button');
        closeBtn.className = 'modal-close';
        closeBtn.innerHTML = '×';
        closeBtn.setAttribute('aria-label', 'Fechar modal');
        
        header.appendChild(titleEl);
        header.appendChild(closeBtn);
        
        const body = document.createElement('div');
        body.className = 'modal-body';
        body.innerHTML = content;
        
        const footer = document.createElement('div');
        footer.className = 'modal-footer';
        
        if (showCancel) {
            const cancelBtn = document.createElement('button');
            cancelBtn.className = 'btn btn-secondary';
            cancelBtn.textContent = cancelText;
            footer.appendChild(cancelBtn);
            
            cancelBtn.addEventListener('click', () => {
                this.hide(overlay);
                if (onCancel) onCancel();
            });
        }
        
        const confirmBtn = document.createElement('button');
        confirmBtn.className = 'btn btn-primary';
        confirmBtn.textContent = confirmText;
        footer.appendChild(confirmBtn);
        
        confirmBtn.addEventListener('click', () => {
            if (onConfirm) onConfirm();
            this.hide(overlay);
        });
        
        modal.appendChild(header);
        modal.appendChild(body);
        modal.appendChild(footer);
        overlay.appendChild(modal);
        
        // Close on click outside or close button
        const closeHandler = (e: Event) => {
            if (e.target === overlay || e.target === closeBtn) {
                this.hide(overlay);
                if (onCancel) onCancel();
            }
        };
        
        overlay.addEventListener('click', closeHandler);
        closeBtn.addEventListener('click', closeHandler);
        
        // Close on Escape key
        const keyHandler = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                this.hide(overlay);
                if (onCancel) onCancel();
            }
        };
        
        document.addEventListener('keydown', keyHandler);
        
        // Store cleanup function
        (overlay as any)._cleanup = () => {
            document.removeEventListener('keydown', keyHandler);
        };
        
        container.appendChild(overlay);
        
        // Show modal
        setTimeout(() => overlay.classList.add('show'), 100);
        
        return modal;
    }
    
    static hide(overlay: HTMLElement) {
        overlay.classList.remove('show');
        setTimeout(() => {
            if (overlay.parentNode) {
                // Cleanup event listeners
                if ((overlay as any)._cleanup) {
                    (overlay as any)._cleanup();
                }
                overlay.parentNode.removeChild(overlay);
            }
        }, 200);
    }
    
    static confirm(title: string, message: string): Promise<boolean> {
        return new Promise((resolve) => {
            this.show(title, `<p>${message}</p>`, {
                onConfirm: () => resolve(true),
                onCancel: () => resolve(false),
                confirmText: 'Sim',
                cancelText: 'Não'
            });
        });
    }
    
    static alert(title: string, message: string): Promise<void> {
        return new Promise((resolve) => {
            this.show(title, `<p>${message}</p>`, {
                onConfirm: () => resolve(),
                showCancel: false,
                confirmText: 'OK'
            });
        });
    }
}

export class LicenseBadge {
    static render(used: number, limit: number): string {
        const percentage = limit > 0 ? (used / limit) * 100 : 0;
        
        let tone: string;
        let text: string;
        
        if (used === 0) {
            tone = 'gray';
            text = `0/${limit} Licenças`;
        } else if (used < limit) {
            tone = 'blue';
            text = `${used}/${limit} Licenças`;
        } else if (used === limit) {
            tone = 'green';
            text = `${used}/${limit} Licenças (Completa)`;
        } else {
            tone = 'red';
            text = `${used}/${limit} Licenças (Excesso)`;
        }
        
        return `<span class="badge badge-${tone}">${text}</span>`;
    }
}

export class Card {
    static render(options: {
        title?: string;
        subtitle?: string;
        content: string;
        footer?: string;
        className?: string;
    }): string {
        const { title, subtitle, content, footer, className = '' } = options;
        
        let html = `<div class="card ${className}">`;
        
        if (title || subtitle) {
            html += '<div class="card-header">';
            if (title) {
                html += `<h3 class="card-title">${title}</h3>`;
            }
            if (subtitle) {
                html += `<p class="card-subtitle">${subtitle}</p>`;
            }
            html += '</div>';
        }
        
        html += `<div class="card-content">${content}</div>`;
        
        if (footer) {
            html += `<div class="card-footer">${footer}</div>`;
        }
        
        html += '</div>';
        
        return html;
    }
}

export class LoadingSpinner {
    static render(text: string = 'Carregando...'): string {
        return `
            <div class="flex flex-col items-center justify-center gap-4 py-8">
                <div class="spinner"></div>
                <p class="text-gray">${text}</p>
            </div>
        `;
    }
}

export class EmptyState {
    static render(title: string, message: string, action?: { text: string, href?: string, onclick?: string }): string {
        let html = `
            <div class="text-center py-12">
                <div class="text-6xl mb-4">📁</div>
                <h3 class="text-xl font-semibold mb-2">${title}</h3>
                <p class="text-gray mb-6">${message}</p>
        `;
        
        if (action) {
            if (action.href) {
                html += `<a href="${action.href}" class="btn btn-primary">${action.text}</a>`;
            } else if (action.onclick) {
                html += `<button onclick="${action.onclick}" class="btn btn-primary">${action.text}</button>`;
            }
        }
        
        html += '</div>';
        
        return html;
    }
}

export class FormBuilder {
    static input(options: {
        id: string;
        label: string;
        type?: string;
        required?: boolean;
        placeholder?: string;
        value?: string;
        options?: { value: string, text: string }[];
    }): string {
        const { id, label, type = 'text', required = false, placeholder = '', value = '', options } = options;
        
        let html = `<div class="form-group">`;
        html += `<label for="${id}" class="form-label">${label}${required ? ' *' : ''}</label>`;
        
        if (type === 'select' && options) {
            html += `<select id="${id}" class="form-select" ${required ? 'required' : ''}>`;
            html += `<option value="">Selecione...</option>`;
            options.forEach(opt => {
                const selected = opt.value === value ? 'selected' : '';
                html += `<option value="${opt.value}" ${selected}>${opt.text}</option>`;
            });
            html += '</select>';
        } else if (type === 'textarea') {
            html += `<textarea id="${id}" class="form-textarea" ${required ? 'required' : ''} placeholder="${placeholder}">${value}</textarea>`;
        } else {
            html += `<input type="${type}" id="${id}" class="form-input" ${required ? 'required' : ''} placeholder="${placeholder}" value="${value}">`;
        }
        
        html += '</div>';
        
        return html;
    }
    
    static getFormData(formId: string): Record<string, any> {
        const form = document.getElementById(formId) as HTMLFormElement;
        if (!form) return {};
        
        const formData = new FormData(form);
        const data: Record<string, any> = {};
        
        for (const [key, value] of formData.entries()) {
            data[key] = value;
        }
        
        return data;
    }
    
    static validateForm(formId: string): boolean {
        const form = document.getElementById(formId) as HTMLFormElement;
        if (!form) return false;
        
        return form.checkValidity();
    }
}