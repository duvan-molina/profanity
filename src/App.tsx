import { useState } from 'react'
import './App.css'

interface FormData {
  nombre: string;
  apellido: string;
  correo: string;
  comentarios: string;
}

interface ProfanityResponse {
  original: FormData;
  censored: FormData;
  has_profanity: boolean;
  sensitivity: Array<{
    swearWord: string;
    sensitivity: 1 | 2 | 3;
    textOriginal: string;
  }>;
}

function App() {
  const [formData, setFormData] = useState<FormData>({
    nombre: '',
    apellido: '',
    correo: '',
    comentarios: ''
  });

  const [isLoading, setIsLoading] = useState(false);
  const [profanityResult, setProfanityResult] = useState<ProfanityResponse | null>(null);
  const [isWordsExpanded, setIsWordsExpanded] = useState(false);
  const [selectedActions, setSelectedActions] = useState<{[key: number]: string}>({});

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateProfanity = async (data: FormData): Promise<ProfanityResponse> => {
    const response = await fetch('https://salvation-unwrap-aquarium-scary.trycloudflare.com/profanity/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      throw new Error('Error al validar el contenido');
    }

    return response.json();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const result = await validateProfanity(formData);
      setProfanityResult(result);

      if (result.has_profanity) {
        alert('¡Atención! Se detectaron palabras inapropiadas en el formulario. El texto ha sido censurado.');
      } else {
        alert('Formulario enviado correctamente. No se detectaron palabras inapropiadas.');
        // Here you could send the data to your backend
        console.log('Datos del formulario:', formData);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error al procesar el formulario. Por favor, inténtalo de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="app-container">
      <h1>Formulario de Datos Personales</h1>
      <div className="main-content">
        <form onSubmit={handleSubmit} className="personal-form">
        <div className="form-group">
          <label htmlFor="nombre">Nombre:</label>
          <input
            type="text"
            id="nombre"
            name="nombre"
            value={formData.nombre}
            onChange={handleInputChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="apellido">Apellido:</label>
          <input
            type="text"
            id="apellido"
            name="apellido"
            value={formData.apellido}
            onChange={handleInputChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="correo">Correo Electrónico:</label>
          <input
            type="email"
            id="correo"
            name="correo"
            value={formData.correo}
            onChange={handleInputChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="comentarios">Comentarios Adicionales:</label>
          <textarea
            id="comentarios"
            name="comentarios"
            value={formData.comentarios}
            onChange={handleInputChange}
            rows={4}
            placeholder="Escribe tus comentarios aquí..."
          />
        </div>

          <button type="submit" disabled={isLoading} className="submit-btn">
            {isLoading ? 'Validando...' : 'Guardar Datos'}
          </button>
        </form>

        {profanityResult && profanityResult.has_profanity && (
          <div className="profanity-results">
            <h2>Palabras Censuradas Detectadas</h2>
            <div className="censored-words">
              <div 
                className="words-header" 
                onClick={() => setIsWordsExpanded(!isWordsExpanded)}
              >
                <span className="words-count">
                  {profanityResult.sensitivity.length} palabra{profanityResult.sensitivity.length !== 1 ? 's' : ''} detectada{profanityResult.sensitivity.length !== 1 ? 's' : ''}
                </span>
                <span className={`expand-icon ${isWordsExpanded ? 'expanded' : ''}`}>
                  ▼
                </span>
              </div>
              
              {isWordsExpanded && (
                <div className="words-list">
                  {profanityResult.sensitivity.map((item, index) => (
                    <div key={index} className="censored-word-item">
                      <div className="word-info">
                        <span className="swear-word">Palabra censurada: {item.swearWord}</span>
                        <span className="original-text">Original: "{item.textOriginal}"</span>
                        <span className="sensitivity-level">Nivel: {item.sensitivity}</span>
                      </div>
                      <div className="action-dropdown">
                        <select 
                          value={selectedActions[index] || ''}
                          onChange={(e) => setSelectedActions(prev => ({...prev, [index]: e.target.value}))}
                          className="action-select"
                        >
                          <option value="">Seleccionar acción</option>
                          <option value="keep-censored">Mantener censurado</option>
                          <option value="keep-original">Mantener original</option>
                          <option value="replace">Reemplazar con...</option>
                        </select>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
          </div>
        )}
      </div>
    </div>
  )
}

export default App
