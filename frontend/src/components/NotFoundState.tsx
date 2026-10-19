import { Link } from "react-router-dom";

interface NotFoundStateProps {
  title?: string;
  message?: string;
  backTo?: string;
  backLabel?: string;
}

const NotFoundState = ({
  title = "Page not found",
  message = "The page you are looking for doesn't exist or has been moved.",
  backTo = "/bounties",
  backLabel = "Back to bounties",
}: NotFoundStateProps) => {
  return (
    <div className="flex min-h-[60vh] w-full flex-col items-center justify-center px-4 py-16 text-center sm:px-6 lg:px-8">
      <p className="text-6xl font-bold tracking-tight text-gray-300 sm:text-7xl">
        404
      </p>
      <h1 className="mt-4 text-2xl font-semibold text-gray-900 sm:text-3xl">
        {title}
      </h1>
      <p className="mt-3 max-w-md text-sm text-gray-500 sm:text-base">
        {message}
      </p>
      <Link
        to={backTo}
        className="mt-8 inline-flex items-center justify-center rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-indigo-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
      >
        {backLabel}
      </Link>
    </div>
  );
};

export default NotFoundState;
