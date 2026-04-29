import { FormEvent, useMemo, useState } from 'react';
import Icon from './Icon';
import type { PlayerProfile } from '../types';

type Props = {
  onLogin: (email: string, password: string) => Promise<void>;
  onRegister: (profile: PlayerProfile, email: string, password: string, username: string) => Promise<void>;
};

const positions = ['Armador', 'Ala', 'Pivo'];
const levels = ['Iniciante', 'Intermediario', 'Avancado'];
const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

function getAge(year: string, month: string, day: string) {
  if (!year || !month || !day) return '';
  const birthDate = new Date(Number(year), Number(month) - 1, Number(day));
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const passedBirthday =
    today.getMonth() > birthDate.getMonth() ||
    (today.getMonth() === birthDate.getMonth() && today.getDate() >= birthDate.getDate());
  if (!passedBirthday) age -= 1;
  return String(Math.max(age, 0));
}

function LoginScreen({ onLogin, onRegister }: Props) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [day, setDay] = useState('');
  const [month, setMonth] = useState('');
  const [year, setYear] = useState('');

  const [city, setCity] = useState('Mallet-PR');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [position, setPosition] = useState('Armador');
  const [level, setLevel] = useState('Intermediario');
  const [availability, setAvailability] = useState('');
  const [characteristics, setCharacteristics] = useState('');
  const [history, setHistory] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const years = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: 70 }, (_, index) => String(currentYear - 8 - index));
  }, []);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');

    if (!email.trim() || !password.trim()) {
      setError('Preencha email e senha.');
      return;
    }

    if (mode === 'login') {
      setIsSubmitting(true);
      try {
        await onLogin(email.trim(), password);
      } catch {
        setError('Conta nao encontrada. Cadastre-se antes de entrar.');
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    if (!day || !month || !year || !name.trim() || !username.trim()) {
      setError('Complete nascimento, nome e nome de usuario para cadastrar.');
      return;
    }

    const cleanUsername = username.trim().replace(/^@/, '').toLowerCase();
    const profile: PlayerProfile = {
      name: name.trim(),
      username: cleanUsername,
      age: getAge(year, month, day),
      height,
      weight,
      position,
      level,
      availability,
      characteristics,
      history,
      city: city.trim() || 'Mallet-PR',
      bannerUrl: '',
      avatarUrl: '',
    };

    setIsSubmitting(true);
    try {
      await onRegister(profile, email.trim(), password, cleanUsername);
    } catch {
      setError('Nao foi possivel cadastrar. Talvez esse email ou usuario ja exista.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleMode = () => {
    setMode((current) => (current === 'login' ? 'register' : 'login'));
    setError('');
  };

  return (
    <main className="login-screen insta-auth">
      <form className="login-card insta-card" onSubmit={submit}>
        <button className="auth-back" type="button" aria-label="Voltar">
          <Icon name="chevron" />
        </button>

        <div className="meta-lockup">
          <Icon name="chat" />
          <span>Hoopers</span>
        </div>

        <div className="auth-heading">
          <h1>{mode === 'register' ? 'Comece a usar o Hoopers' : 'Bem-vindo ao Hoopers'}</h1>
          <p>
            {mode === 'register'
              ? 'Crie sua conta para conectar com atletas e encontrar rachoes.'
              : 'Entre com sua conta para acessar a comunidade de basquete.'}
          </p>
        </div>

        <label className="login-field">
          <span>Numero de celular ou email</span>
          <input
            id="login-email"
            name="username"
            type="text"
            value={email}
            onChange={(event) => {
              setEmail(event.target.value);
              setError('');
            }}
            placeholder="Numero de celular ou email"
            autoComplete="username"
          />
        </label>

        <label className="login-field">
          <span>Senha</span>
          {mode === 'login' ? (
            <input
              name="password"
              type="password"
              value={password}
              onChange={(event) => {
                setPassword(event.target.value);
                setError('');
              }}
              placeholder="Senha"
              autoComplete="current-password"
            />
          ) : (
            <input
              name="password"
              type="password"
              value={password}
              onChange={(event) => {
                setPassword(event.target.value);
                setError('');
              }}
              placeholder="Senha"
              autoComplete="new-password"
            />
          )}
        </label>

        {mode === 'register' && (
          <>
            <div className="birth-heading">
              <span>Data de nascimento</span>
              <b>?</b>
            </div>

            <div className="date-grid">
              <label className="login-field">
                <select value={day} onChange={(event) => setDay(event.target.value)} aria-label="Dia">
                  <option value="">Dia</option>
                  {Array.from({ length: 31 }, (_, index) => String(index + 1)).map((item) => (
                    <option key={item} value={item}>{item}</option>
                  ))}
                </select>
              </label>

              <label className="login-field">
                <select value={month} onChange={(event) => setMonth(event.target.value)} aria-label="Mes">
                  <option value="">Mes</option>
                  {months.map((item, index) => (
                    <option key={item} value={String(index + 1)}>{item}</option>
                  ))}
                </select>
              </label>

              <label className="login-field">
                <select value={year} onChange={(event) => setYear(event.target.value)} aria-label="Ano">
                  <option value="">Ano</option>
                  {years.map((item) => (
                    <option key={item} value={item}>{item}</option>
                  ))}
                </select>
              </label>
            </div>

            <label className="login-field">
              <span>Nome</span>
              <input
                type="text"
                value={name}
                onChange={(event) => {
                  setName(event.target.value);
                  setError('');
                }}
                placeholder="Nome completo"
                autoComplete="name"
              />
            </label>

            <label className="login-field">
              <span>Nome de usuario</span>
              <input
                name="nickname"
                type="text"
                value={username}
                onChange={(event) => {
                  setUsername(event.target.value);
                  setError('');
                }}
                placeholder="Nome de usuario"
                autoComplete="nickname"
              />
            </label>

            <label className="login-field">
              <span>Cidade</span>
              <input
                type="text"
                value={city}
                onChange={(event) => setCity(event.target.value)}
                placeholder="Mallet-PR"
                autoComplete="address-level2"
              />
            </label>

            <div className="athlete-fields">
              <div className="login-split">
                <label className="login-field">
                  <span>Altura</span>
                  <input type="text" value={height} onChange={(event) => setHeight(event.target.value)} placeholder="1,82m" />
                </label>

                <label className="login-field">
                  <span>Peso</span>
                  <input type="text" value={weight} onChange={(event) => setWeight(event.target.value)} placeholder="76kg" />
                </label>
              </div>

              <div className="login-split">
                <label className="login-field">
                  <span>Posicao</span>
                  <select value={position} onChange={(event) => setPosition(event.target.value)}>
                    {positions.map((item) => (
                      <option key={item} value={item}>{item}</option>
                    ))}
                  </select>
                </label>

                <label className="login-field">
                  <span>Nivel</span>
                  <select value={level} onChange={(event) => setLevel(event.target.value)}>
                    {levels.map((item) => (
                      <option key={item} value={item}>{item}</option>
                    ))}
                  </select>
                </label>
              </div>

              <label className="login-field">
                <span>Disponibilidade</span>
                <input
                  type="text"
                  value={availability}
                  onChange={(event) => setAvailability(event.target.value)}
                  placeholder="Noites e sabados"
                />
              </label>

              <label className="login-field">
                <span>Caracteristicas</span>
                <textarea
                  value={characteristics}
                  onChange={(event) => setCharacteristics(event.target.value)}
                  placeholder="Arremesso, defesa, velocidade..."
                  rows={3}
                />
              </label>

              <label className="login-field">
                <span>Historia no basket</span>
                <textarea
                  value={history}
                  onChange={(event) => setHistory(event.target.value)}
                  placeholder="Conte sua caminhada nas quadras"
                  rows={3}
                />
              </label>
            </div>
          </>
        )}

        {error && <p className="login-error">{error}</p>}

        <button type="submit" className="login-button" disabled={isSubmitting}>
          {isSubmitting ? 'Aguarde...' : mode === 'login' ? 'Entrar' : 'Cadastrar'}
        </button>

        <p className="login-switch">
          {mode === 'login' ? 'Nao tem uma conta?' : 'Ja tem uma conta?'}
          <button type="button" onClick={toggleMode}>
            {mode === 'login' ? 'Cadastre-se aqui' : 'Entrar aqui'}
          </button>
        </p>
      </form>
    </main>
  );
}

export default LoginScreen;
