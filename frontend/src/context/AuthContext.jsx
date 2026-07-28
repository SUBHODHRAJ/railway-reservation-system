import {
    createContext,
    useContext,
    useEffect,
    useState
} from "react";

import {
    getProfile,
    loginUser,
    registerUser,
    updateProfile
} from "../api/authApi";

const AuthContext = createContext(null);

const normaliseUser = user => {
    if (!user) {
        return null;
    }

    return {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        emailVerified:
            user.emailVerified ??
            Boolean(user.email_verified)
    };
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(() => {
        try {
            const saved =
                localStorage.getItem("user");

            return saved
                ? normaliseUser(
                      JSON.parse(saved)
                  )
                : null;
        } catch {
            return null;
        }
    });

    const [loading, setLoading] = useState(
        Boolean(
            localStorage.getItem("token")
        )
    );

    const saveUser = value => {
        const normalised =
            normaliseUser(value);

        setUser(normalised);

        if (normalised) {
            localStorage.setItem(
                "user",
                JSON.stringify(normalised)
            );
        } else {
            localStorage.removeItem(
                "user"
            );
        }

        return normalised;
    };

    const refreshProfile = async () => {
        const { data } =
            await getProfile();

        return saveUser(data);
    };

    const updateAccount = async details => {
        const { data } =
            await updateProfile(details);

        const updatedUser =
            saveUser(data.user);

        return {
            ...data,
            user: updatedUser
        };
    };

    useEffect(() => {
        const token =
            localStorage.getItem("token");

        if (!token) {
            setLoading(false);
            return;
        }

        const loadProfile = async () => {
            try {
                await refreshProfile();
            } catch {
                localStorage.removeItem(
                    "token"
                );

                localStorage.removeItem(
                    "user"
                );

                setUser(null);
            } finally {
                setLoading(false);
            }
        };

        loadProfile();
    }, []);

    const login = async credentials => {
        const { data } =
            await loginUser(credentials);

        localStorage.setItem(
            "token",
            data.token
        );

        const loggedUser =
            saveUser(data.user);

        return {
            ...data,
            user: loggedUser
        };
    };

    const register = async details => {
        const { data } =
            await registerUser(details);

        return data;
    };

    const logout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");

        setUser(null);
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                loading,
                login,
                register,
                logout,
                refreshProfile,
                updateAccount
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context =
        useContext(AuthContext);

    if (!context) {
        throw new Error(
            "useAuth must be used inside AuthProvider"
        );
    }

    return context;
};