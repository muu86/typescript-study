namespace App {
    // decorator
    export function autobind(_1: any, _2: string, descriptor: PropertyDescriptor) {
        const originalMethod = descriptor.value;
        const adjDescriptor: PropertyDescriptor = {
            configurable: true,
            get() {
                const boundFn = originalMethod.bind(this);
                return boundFn;
            }
        };
        
        return adjDescriptor;
    }
}