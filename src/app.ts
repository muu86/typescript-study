/// <reference path="drag_drop_interfaces.ts" />
/// <reference path="project_model.ts" />
/// <reference path="project_state.ts" />
/// <reference path="validation.ts" />
/// <reference path="autobind_decorator.ts" />

namespace App {
    
    // BaseClass
    abstract class Component<T extends HTMLElement, U extends HTMLElement> {
        templateElement: HTMLTemplateElement;
        hostElement: T;
        element: U;
        
        constructor(templateId: string, hostElementId: string, insertAtBeginning: boolean, newElementId? : string) {
            this.templateElement = <HTMLTemplateElement>document.getElementById(templateId)!;
            this.hostElement = <T>document.getElementById(hostElementId)!;
            const importedNode = document.importNode(this.templateElement.content, true);
            this.element = <U>importedNode.firstElementChild!;
            if (newElementId) {
                this.element.id = newElementId;    
            }
            
            this.attach(insertAtBeginning);
        }
            
        private attach(insertAtBeginning: boolean) {
            const position = insertAtBeginning ? 'afterbegin' : 'beforeend';
            this.hostElement.insertAdjacentElement(position, this.element);
        }
        
        abstract configure(): void;
        abstract renderContent(): void;
    }
    
    class ProjectItem extends Component<HTMLUListElement, HTMLLIElement> implements Draggable {
        
        private project: Project;
        
        constructor(hostId: string, project: Project) {
            super('single-project', hostId, false, project.id);
            this.project = project;
            
            this.configure();
            this.renderContent();
        }
        
        get persons() {
            if (this.project.people === 1) {
                return '1 person';
            } else {
                return `${this.project.people} persons`;
            }
        }
        
        @autobind
        dragStartHandler(event: DragEvent) {
            event.dataTransfer!.setData('text/plain', this.project.id);
            event.dataTransfer!.effectAllowed = 'move';
        }
        
        dragEndHandler(event: DragEvent) {
            console.log('dragend');
        }
        
        configure() {
            this.element.addEventListener('dragstart', this.dragStartHandler);
            this.element.addEventListener('dragend', this.dragEndHandler);
        }
        
        renderContent() {
            this.element.querySelector('h2')!.textContent = this.project.title;
            this.element.querySelector('h3')!.textContent = this.persons + ' assigned';
            this.element.querySelector('p')!.textContent = this.project.description;
        }
    }
    
    class ProjectList extends Component<HTMLDivElement, HTMLElement> implements DragTarget {
        
        constructor(private type: ProjectStatus) {
            super('project-list', 'app', false, `${type}-projects`);
            this.assignedProjects = [];
            
            this.renderContent();
            
            this.configure();
        }
        
        @autobind
        dropHandler(event: DragEvent): void {
            const id = event.dataTransfer!.getData('text/plain');
            projectState.moveProject(id, this.type);
        }
        
        @autobind
        dragOverHandler(event: DragEvent): void {
            if (event.dataTransfer?.types[0] === 'text/plain') {
                event.preventDefault();
                const listEl = this.element.querySelector('ul')!;
                console.log('dragover');
                listEl.classList.add('droppable');    
            }
        }
        
        @autobind
        dragLeaveHandler(_: DragEvent): void {
            const listEl = this.element.querySelector('ul')!;
            console.log('dragleave');
            listEl.classList.remove('droppable');    
        }
        
        assignedProjects: Project[];
        
        configure() {
            this.element.addEventListener('dragover', this.dragOverHandler);
            this.element.addEventListener('dragleave', this.dragLeaveHandler);
            this.element.addEventListener('drop', this.dropHandler);
            
            projectState.addListener((projects: Project[]) => {
                const relevantProjects = projects.filter(project => project.status == this.type);
                this.assignedProjects = relevantProjects;
                this.renderProjects();
            });
        }
    
        renderProjects() {
            const listEl = document.getElementById(`${this.type}-projects-list`)!;
            listEl.innerHTML = '';
            for (const prjItem of this.assignedProjects) {
                new ProjectItem(this.element.querySelector('ul')!.id, prjItem);
            }
        }
        
        renderContent() {
            const listId = `${this.type}-projects-list`;
            this.element.querySelector('ul')!.id = listId;
            this.element.querySelector('h2')!.textContent = this.type.toUpperCase() + ' PROJECTS';
        }
    }
    
    class ProjectInput extends Component<HTMLDivElement, HTMLFormElement> {
        titleInputElement: HTMLInputElement;
        descriptionInputElement: HTMLInputElement;
        peopleInputElement: HTMLInputElement;
        
        constructor() {
            super('project-input', 'app', true, 'user-input');
            
            this.titleInputElement = <HTMLInputElement>this.element.querySelector('#title');
            this.descriptionInputElement = <HTMLInputElement>this.element.querySelector('#description');
            this.peopleInputElement = <HTMLInputElement>this.element.querySelector('#people');
            
            this.configure();
        }
            
        configure() {
            this.element.addEventListener('submit', this.submitHandler);
        }
        
        renderContent() {}
        
        private gatherUserInput(): [string, string, number] | void {
            const enteredTitle = this.titleInputElement.value;
            const enteredDescription = this.descriptionInputElement.value;
            const enteredPeople = this.peopleInputElement.value;
            
            const titleValidatable: Validatable = {
                value: enteredTitle,
                required: true,
            };
            const descValidatable: Validatable = {
                value: enteredDescription,
                required: true,
                minLength: 5
            };
            const peopleValidatable: Validatable = {
                value: +enteredPeople,
                required: true,
                min: 1,
                max: 5
            };
            
            if (!validate(titleValidatable) ||
                !validate(descValidatable) ||
                !validate(peopleValidatable)) {
                    
                alert('Invalid input, please try again!');
                return;
            } else {
                return [enteredTitle, enteredDescription, +enteredPeople];
            }
        }
        
        private clearInputs() {
            this.titleInputElement.value = '';
            this.descriptionInputElement.value = '';
            this.peopleInputElement.value = '';
        }
        
        @autobind
        private submitHandler(event: Event) {
            event.preventDefault();
            const userInput = this.gatherUserInput();
            if (Array.isArray(userInput)) {
                const [title, desc, people] = userInput;
                projectState.addProject(title, desc, people);
                this.clearInputs();
            }
        }
    
    }
    
    new ProjectInput();
    new ProjectList(ProjectStatus.Active);
    new ProjectList(ProjectStatus.Finished);
}

